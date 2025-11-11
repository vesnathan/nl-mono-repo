import {
  CloudFormationClient,
  Parameter,
  Capability,
  CreateStackCommand,
  UpdateStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { S3, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  DeploymentOptions,
  StackType,
  getStackName,
  getTemplateBucketName,
  TEMPLATE_PATHS,
} from "../../types";
import { logger } from "../../utils/logger";
import { ResolverCompiler } from "../../utils/resolver-compiler";
import { S3BucketManager } from "../../utils/s3-bucket-manager";
import { OutputsManager } from "../../outputs-manager";
import { addAppSyncBucketPolicy } from "../../utils/s3-resolver-validator";
import { UserSetupManager } from "../../utils/user-setup";
import { createReadStream, readdirSync, statSync, existsSync } from "fs";
import * as path from "path";
import { execSync } from "child_process";

const findYamlFiles = (dir: string): string[] => {
  const files = readdirSync(dir);
  let yamlFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      yamlFiles = yamlFiles.concat(findYamlFiles(filePath));
    } else if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
      yamlFiles.push(filePath);
    }
  }

  return yamlFiles;
};

// Recursively find all .ts files
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findTypeScriptFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  } catch (error: any) {
    logger.warning(`Error reading directory ${dir}: ${error.message}`);
  }
  return files;
}

export async function deployCardCountingTrainer(
  options: DeploymentOptions,
): Promise<void> {
  const stackName = getStackName(StackType.CardCountingTrainer, options.stage);
  const templateBucketName = getTemplateBucketName(options.stage);

  const stopSpinner = logger.infoWithSpinner(
    "Starting Card Counting Trainer stack deployment in ap-southeast-2",
  );

  const region = options.region || process.env.AWS_REGION || "ap-southeast-2";
  const cfn = new CloudFormationClient({ region });

  // Check if stack already exists
  let stackExists = false;
  try {
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfn.send(describeCommand);
    const stack = response.Stacks?.[0];

    if (stack) {
      stackExists = true;
      logger.debug(
        `Stack ${stackName} exists with status: ${stack.StackStatus}`,
      );
    }
  } catch (error: any) {
    if (
      error.name === "ValidationError" ||
      error.message?.includes("does not exist")
    ) {
      logger.debug(
        `Stack ${stackName} does not exist - will perform initial deployment`,
      );
    } else {
      logger.warning(`Error checking stack existence: ${error.message}`);
    }
  }

  // Build GraphQL schema
  try {
    logger.info("📦 Building GraphQL schema...");
    const frontendPath = path.join(
      __dirname,
      "../../../card-counting-trainer/frontend",
    );

    logger.debug(`Running: yarn build-gql in ${frontendPath}`);
    execSync("yarn build-gql", {
      cwd: frontendPath,
      stdio: options.debugMode ? "inherit" : "pipe",
      encoding: "utf8",
    });
    logger.success("✓ GraphQL schema generated successfully");
  } catch (error: any) {
    logger.error(`Failed to build GraphQL schema: ${error.message}`);
    throw error;
  }

  // Upload templates to S3
  try {
    logger.info("📤 Uploading CloudFormation templates to S3...");
    const s3 = new S3({ region });
    const bucketManager = new S3BucketManager(region);

    await bucketManager.ensureBucketExists(templateBucketName);

    const templatePath = path.join(
      __dirname,
      "../../templates/card-counting-trainer",
    );
    const yamlFiles = findYamlFiles(templatePath);

    for (const filePath of yamlFiles) {
      const relativePath = path.relative(templatePath, filePath);
      const s3Key = relativePath.replace(/\\/g, "/"); // Ensure forward slashes for S3

      logger.debug(
        `Uploading ${relativePath} to s3://${templateBucketName}/${s3Key}`,
      );

      await s3.send(
        new PutObjectCommand({
          Bucket: templateBucketName,
          Key: s3Key,
          Body: createReadStream(filePath),
          ContentType: "text/yaml",
        }),
      );
    }

    logger.success(`✓ Uploaded ${yamlFiles.length} template files to S3`);
  } catch (error: any) {
    logger.error(`Failed to upload templates: ${error.message}`);
    throw error;
  }

  // Add AppSync bucket policy to allow AppSync to read resolver code from S3
  logger.info("Adding AppSync bucket policy...");
  try {
    await addAppSyncBucketPolicy(templateBucketName, region);
    logger.success("AppSync bucket policy configured successfully");
  } catch (error: any) {
    logger.error(`Failed to add AppSync bucket policy: ${error.message}`);
    throw new Error(
      `AppSync bucket policy configuration failed - deployment cannot continue`,
    );
  }

  // Upload GraphQL schema with content hash
  logger.info("📤 Uploading GraphQL schema...");
  const schemaPath = path.join(
    __dirname,
    "../../../card-counting-trainer/backend/combined_schema.graphql",
  );

  let schemaHash = "";
  if (require("fs").existsSync(schemaPath)) {
    const crypto = require("crypto");
    const fs = require("fs");
    const schemaContent = fs.readFileSync(schemaPath, "utf8");
    schemaHash = crypto
      .createHash("sha256")
      .update(schemaContent)
      .digest("hex")
      .substring(0, 16);

    const schemaKey = `schema-${schemaHash}.graphql`;
    logger.debug(`Schema hash: ${schemaHash}, uploading as ${schemaKey}`);

    const s3 = new S3({ region });
    await s3.send(
      new PutObjectCommand({
        Bucket: templateBucketName,
        Key: schemaKey,
        Body: createReadStream(schemaPath),
        ContentType: "application/graphql",
      }),
    );
    logger.success(`✓ Schema uploaded: ${schemaKey}`);
  } else {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  // Compile and upload resolvers
  let resolversBuildHash = "";
  try {
    logger.info("🔧 Compiling and uploading AppSync resolvers...");

    const backendPath = path.join(
      __dirname,
      "../../../card-counting-trainer/backend",
    );
    const resolverDir = path.join(backendPath, "resolvers");

    if (!existsSync(resolverDir)) {
      logger.warning(
        "No resolvers directory found - skipping resolver compilation",
      );
      resolversBuildHash = "none";
    } else {
      logger.success(`Resolver directory found: ${resolverDir}`);
      // Find all resolver files in the specified directory
      const allFiles = findTypeScriptFiles(resolverDir);
      logger.debug(
        `Found ${allFiles.length} total TypeScript files in ${resolverDir}`,
      );

      // Log all discovered files for debugging
      allFiles.forEach((file, index) => {
        logger.debug(`File ${index + 1}: ${file}`);
      });

      const resolverFiles = allFiles
        .map((file) => path.relative(resolverDir, file)) // Convert to relative paths first
        .filter((file) => {
          const shouldInclude =
            !file.endsWith(".bak") && // Exclude backup files
            path.basename(file) !== "gqlTypes.ts" && // Exclude the main types file
            file.includes(path.sep); // IMPORTANT: Only include files in subdirectories (relative path check)

          if (!shouldInclude) {
            logger.debug(`Excluding file: ${file}`);
          }
          return shouldInclude;
        });

      logger.success(
        `After filtering, found ${resolverFiles.length} resolver files to compile:`,
      );
      resolverFiles.forEach((file, index) => {
        logger.success(`  [${index + 1}] ${file}`);
      });

      if (resolverFiles.length === 0) {
        const errorMsg = `No TypeScript resolver files found in ${resolverDir}. This will cause deployment to fail.`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      } else {
        const constantsDir = path.join(backendPath, "constants");

        const resolverCompiler = new ResolverCompiler({
          logger: logger,
          baseResolverDir: resolverDir,
          s3KeyPrefix: "resolvers",
          stage: options.stage,
          s3BucketName: templateBucketName,
          region: region,
          resolverFiles: resolverFiles,
          sharedFileName: "gqlTypes.ts",
          constantsDir: constantsDir,
        });

        resolversBuildHash = await resolverCompiler.compileAndUploadResolvers();
        logger.success("✓ Resolvers compiled and uploaded successfully");
      }
    }
  } catch (error: any) {
    logger.error(`Failed to compile resolvers: ${error.message}`);
    throw error;
  }

  // Deploy CloudFormation stack
  try {
    logger.info("☁️  Deploying CloudFormation stack...");

    const templateUrl = `https://s3.${region}.amazonaws.com/${templateBucketName}/cfn-template.yaml`;

    const stackParams: Parameter[] = [
      { ParameterKey: "Stage", ParameterValue: options.stage },
      {
        ParameterKey: "TemplateBucketName",
        ParameterValue: templateBucketName,
      },
    ];

    // ResolversBuildHash is required by the CloudFormation template
    if (!resolversBuildHash) {
      throw new Error(
        "ResolversBuildHash is required but was not computed. Resolver compilation may have failed.",
      );
    }
    stackParams.push({
      ParameterKey: "ResolversBuildHash",
      ParameterValue: resolversBuildHash,
    });

    // SchemaHash is required for schema versioning
    if (!schemaHash) {
      throw new Error(
        "SchemaHash is required but was not computed. Schema upload may have failed.",
      );
    }
    stackParams.push({
      ParameterKey: "SchemaHash",
      ParameterValue: schemaHash,
    });

    const capabilities: Capability[] = [
      Capability.CAPABILITY_IAM,
      Capability.CAPABILITY_NAMED_IAM,
    ];

    stopSpinner();

    if (stackExists) {
      logger.info(`Updating existing stack: ${stackName}`);
      await cfn.send(
        new UpdateStackCommand({
          StackName: stackName,
          TemplateURL: templateUrl,
          Parameters: stackParams,
          Capabilities: capabilities,
        }),
      );
    } else {
      logger.info(`Creating new stack: ${stackName}`);
      const createCommand: any = {
        StackName: stackName,
        TemplateURL: templateUrl,
        Parameters: stackParams,
        Capabilities: capabilities,
      };

      // Add DisableRollback if option is set (default: false)
      if (options.disableRollback) {
        createCommand.DisableRollback = true;
        logger.info(
          "DisableRollback is enabled - stack will not rollback on failure",
        );
      }

      await cfn.send(new CreateStackCommand(createCommand));
    }

    logger.info("⏳ Waiting for stack deployment to complete...");

    // Simple wait for stack completion
    let stackStatus = "";
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const response = await cfn.send(
        new DescribeStacksCommand({ StackName: stackName }),
      );
      stackStatus = response.Stacks?.[0]?.StackStatus || "";

      if (
        stackStatus === "CREATE_COMPLETE" ||
        stackStatus === "UPDATE_COMPLETE"
      ) {
        break;
      }

      if (stackStatus.includes("FAILED") || stackStatus.includes("ROLLBACK")) {
        throw new Error(`Stack deployment failed with status: ${stackStatus}`);
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Stack deployment timed out");
    }

    logger.success(`✓ Stack deployed successfully: ${stackStatus}`);
  } catch (error: any) {
    if (error.message?.includes("No updates are to be performed")) {
      logger.info("Stack is already up to date - no changes needed");
    } else {
      logger.error(`Failed to deploy stack: ${error.message}`);
      throw error;
    }
  }

  // Save deployment outputs
  try {
    logger.info("💾 Saving deployment outputs...");
    const outputsManager = new OutputsManager();
    await outputsManager.saveStackOutputs(
      StackType.CardCountingTrainer,
      options.stage,
      region,
    );
    logger.success("✓ Deployment outputs saved successfully");
  } catch (error: any) {
    logger.error(`Failed to save outputs: ${error.message}`);
    // don't throw - this is non-critical
  }

  // Build frontend if it wasn't built yet and stack is now healthy
  const frontendOutPath = path.join(
    __dirname,
    "../../../card-counting-trainer/frontend/out",
  );
  const frontendPath = path.join(
    __dirname,
    "../../../card-counting-trainer/frontend",
  );

  // Check if frontend needs to be built (out directory doesn't exist)
  if (
    !require("fs").existsSync(frontendOutPath) &&
    !options.skipFrontendBuild
  ) {
    try {
      // Verify stack is now healthy (has required outputs)
      const postDeployStackData = await cfn.send(
        new DescribeStacksCommand({ StackName: stackName }),
      );
      const hasApiUrl = postDeployStackData.Stacks?.[0]?.Outputs?.some(
        (output) => output.OutputKey === "ApiUrl",
      );
      const hasCognito = postDeployStackData.Stacks?.[0]?.Outputs?.some(
        (output) => output.OutputKey === "UserPoolId",
      );

      if (hasApiUrl && hasCognito) {
        logger.info("🏗️  Building frontend application (post-deployment)...");
        logger.info("   Stack is now healthy with API and Cognito outputs");

        // Generate GraphQL schema and types first
        logger.info("📝 Generating GraphQL schema and types...");
        execSync("yarn build-gql", {
          cwd: frontendPath,
          stdio: options.debugMode ? "inherit" : "pipe",
          encoding: "utf8",
        });

        // Build frontend
        execSync("yarn build", {
          cwd: frontendPath,
          stdio: options.debugMode ? "inherit" : "pipe",
          encoding: "utf8",
        });
        logger.success("✓ Frontend built successfully");
      } else {
        logger.warning(
          "Stack deployed but missing API/Cognito outputs. Skipping frontend build.",
        );
      }
    } catch (buildError: any) {
      logger.error(`Failed to build frontend: ${buildError.message}`);
      logger.warning("Continuing without frontend build...");
    }
  }

  // Upload frontend to S3 if it was built
  try {
    // Check if the out directory exists
    if (require("fs").existsSync(frontendOutPath)) {
      logger.info("📤 Uploading frontend to S3...");

      // Get bucket name from stack outputs
      const stackOutputs = await cfn.send(
        new DescribeStacksCommand({ StackName: stackName }),
      );
      const bucketName = stackOutputs.Stacks?.[0]?.Outputs?.find(
        (output) => output.OutputKey === "WebsiteBucket",
      )?.OutputValue;

      if (bucketName) {
        logger.debug(`Uploading to bucket: ${bucketName}`);

        // Use custom AWS CLI path if available (for local-aws setup)
        const awsCliPath = process.env.AWS_CLI_PATH || "aws";
        const noVerifyFlag =
          process.env.AWS_NO_VERIFY_SSL === "true" ? "--no-verify-ssl" : "";

        // Use AWS CLI sync for efficient upload
        const syncCommand = `${awsCliPath} s3 sync ${frontendOutPath} s3://${bucketName}/ --delete ${noVerifyFlag}`;
        execSync(syncCommand, {
          stdio: options.debugMode ? "inherit" : "pipe",
          encoding: "utf8",
        });

        logger.success("✓ Frontend uploaded to S3");

        // Invalidate CloudFront cache
        const distributionId = stackOutputs.Stacks?.[0]?.Outputs?.find(
          (output) => output.OutputKey === "CloudFrontDistributionId",
        )?.OutputValue;

        if (distributionId) {
          logger.info("🔄 Invalidating CloudFront cache...");
          const { CloudFrontClient, CreateInvalidationCommand } = await import(
            "@aws-sdk/client-cloudfront"
          );
          const cfClient = new CloudFrontClient({ region: "us-east-1" });

          await cfClient.send(
            new CreateInvalidationCommand({
              DistributionId: distributionId,
              InvalidationBatch: {
                CallerReference: Date.now().toString(),
                Paths: {
                  Quantity: 1,
                  Items: ["/*"],
                },
              },
            }),
          );
          logger.success("✓ CloudFront cache invalidation created");
        }
      } else {
        logger.warning(
          "Could not find WebsiteBucket output. Skipping frontend upload.",
        );
      }
    } else {
      logger.info(
        "⏭️  Skipping frontend upload (out directory not found). Run frontend build with 'output: export' to generate static files.",
      );
    }
  } catch (uploadError: any) {
    logger.error(`Failed to upload frontend: ${uploadError.message}`);
    // Don't throw - continue with deployment
  }

  // Print CloudFront URL
  try {
    const finalStackData = await cfn.send(
      new DescribeStacksCommand({ StackName: stackName }),
    );
    const cfDomainOutput = finalStackData.Stacks?.[0]?.Outputs?.find(
      (output) => output.OutputKey === "CloudFrontDomainName",
    );
    if (cfDomainOutput?.OutputValue) {
      logger.success("");
      logger.success("🌐 Your application is deployed at:");
      logger.success(`   https://${cfDomainOutput.OutputValue}`);
      logger.success("");
    }
  } catch (error) {
    // Ignore error - this is just informational
  }

  // Create Cognito admin user if requested
  if (!options.skipUserCreation) {
    try {
      const adminEmail = options.adminEmail || process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        logger.info(
          "No admin email provided (options.adminEmail or ADMIN_EMAIL). Skipping Cognito admin creation.",
        );
      } else {
        logger.info(
          `👤 Creating Cognito admin user for CCT: ${adminEmail}`,
        );
        const userManager = new UserSetupManager(region, "cct");
        await userManager.createAdminUser({
          stage: options.stage,
          adminEmail,
          region,
          stackType: "cct",
        });
        logger.success("✓ Cognito admin user created for CCT");
      }
    } catch (userError: any) {
      logger.error(
        `CCT Cognito admin creation failed: ${userError instanceof Error ? userError.message : userError}`,
      );
      // don't throw to avoid failing the entire deploy; surface error to logs
    }
  }

  logger.success("🎉 Card Counting Trainer deployment completed successfully!");
}
