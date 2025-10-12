import {
  CloudFormationClient,
  Parameter,
  Capability,
  CreateStackCommand,
  UpdateStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import {
  S3,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
  _Object,
  PutPublicAccessBlockCommand,
  PutBucketVersioningCommand,
} from "@aws-sdk/client-s3";
import {
  DeploymentOptions,
  StackType,
  TEMPLATE_RESOURCES_PATHS,
  getStackName,
  getTemplateBucketName,
  TEMPLATE_PATHS,
} from "../../types";
import { logger } from "../../utils/logger";
import { IamManager } from "../../utils/iam-manager";
import { ResolverCompiler } from "../../utils/resolver-compiler";
import { LambdaCompiler } from "../../utils/lambda-compiler";
import { S3BucketManager } from "../../utils/s3-bucket-manager";
import { OutputsManager } from "../../outputs-manager";
import { addAppSyncBucketPolicy } from "../../utils/s3-resolver-validator";
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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = MAX_RETRIES,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      logger.warning(
        `Operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`,
      );
      await sleep(RETRY_DELAY * attempt);
    }
  }
  throw new Error("Unexpected: Should not reach here");
}

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

// Helper function to wait for stack creation or update to complete
async function waitForStackCompletion(
  cfn: CloudFormationClient,
  stackName: string,
  operation: "CREATE" | "UPDATE",
): Promise<void> {
  const maxAttempts = 120; // 20 minutes
  const delay = 10000; // 10 seconds

  const inProgressStatuses =
    operation === "CREATE"
      ? ["CREATE_IN_PROGRESS", "REVIEW_IN_PROGRESS"]
      : ["UPDATE_IN_PROGRESS", "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS"];

  const successStatus =
    operation === "CREATE" ? "CREATE_COMPLETE" : "UPDATE_COMPLETE";
  const failureStatuses =
    operation === "CREATE"
      ? [
          "CREATE_FAILED",
          "ROLLBACK_COMPLETE",
          "ROLLBACK_FAILED",
          "ROLLBACK_IN_PROGRESS",
        ]
      : [
          "UPDATE_FAILED",
          "UPDATE_ROLLBACK_COMPLETE",
          "UPDATE_ROLLBACK_FAILED",
          "UPDATE_ROLLBACK_IN_PROGRESS",
        ];

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await cfn.send(
        new DescribeStacksCommand({ StackName: stackName }),
      );
      const stack = response.Stacks?.[0];

      if (!stack) {
        throw new Error(
          `Stack ${stackName} not found during ${operation.toLowerCase()} operation`,
        );
      }

      const status = stack.StackStatus;

      if (!status) {
        throw new Error(`Stack ${stackName} status is undefined`);
      }

      if (status === successStatus) {
        logger.success(
          `Stack ${stackName} ${operation.toLowerCase()} completed successfully`,
        );
        return;
      }

      if (failureStatuses.includes(status)) {
        throw new Error(
          `Stack ${stackName} ${operation.toLowerCase()} failed with status: ${status}`,
        );
      }

      if (inProgressStatuses.includes(status)) {
        logger.debug(
          `Waiting for ${stackName} ${operation.toLowerCase()}... Status: ${status} (${i + 1}/${maxAttempts}) - ${Math.round(((i + 1) / maxAttempts) * 100)}% complete`,
        );
      } else {
        logger.debug(
          `Stack ${stackName} status: ${status} (${i + 1}/${maxAttempts})`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error: any) {
      if (i === maxAttempts - 1) {
        throw error;
      }

      logger.warning(
        `Error checking stack status (attempt ${i + 1}/${maxAttempts}): ${error.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `Timeout waiting for stack ${stackName} ${operation.toLowerCase()} after ${(maxAttempts * delay) / 1000} seconds`,
  );
}

export async function deployAwsExample(
  options: DeploymentOptions,
): Promise<void> {
  const stackName = getStackName(StackType.AwsExample, options.stage);
  const templateBucketName = getTemplateBucketName(
    StackType.AwsExample,
    options.stage,
  );

  const stopSpinner = logger.infoWithSpinner(
    "Starting AWS Example stack deployment in ap-southeast-2",
  );

  const region = options.region || process.env.AWS_REGION || "ap-southeast-2";

  // Initialize clients early to check if stack exists
  const cfn = new CloudFormationClient({ region });

  // Check if stack already exists and is in a healthy state
  let stackExists = false;
  let stackIsHealthy = false;
  try {
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfn.send(describeCommand);
    const stack = response.Stacks?.[0];

    if (stack) {
      stackExists = true;
      const status = stack.StackStatus;

      // Only consider stack healthy if it's in a complete/operational state
      stackIsHealthy =
        status === "CREATE_COMPLETE" ||
        status === "UPDATE_COMPLETE" ||
        status === "UPDATE_ROLLBACK_COMPLETE";

      logger.debug(`Stack ${stackName} exists with status: ${status}`);
      logger.debug(`Stack is healthy for frontend build: ${stackIsHealthy}`);
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

  // Build GraphQL schema and types (always needed)
  try {
    logger.info("📦 Building GraphQL schema and types...");
    const frontendPath = path.join(__dirname, "../../../aws-example/frontend");

    // Run build-gql to generate combined_schema.graphql and gqlTypes.ts
    logger.debug(`Running: yarn build-gql in ${frontendPath}`);
    execSync("yarn build-gql", {
      cwd: frontendPath,
      stdio: options.debugMode ? "inherit" : "pipe",
      encoding: "utf8",
    });
    logger.success("✓ GraphQL schema and types generated successfully");

    // Skip frontend build if explicitly requested via options
    if (options.skipFrontendBuild) {
      logger.info("⏭️  Skipping frontend build (skipFrontendBuild option set)");
    }
    // Only build frontend if stack exists AND is healthy (has API endpoint and Cognito outputs)
    else if (stackIsHealthy) {
      logger.info("🏗️  Building frontend application...");
      logger.debug(`Running: yarn build in ${frontendPath}`);
      execSync("yarn build", {
        cwd: frontendPath,
        stdio: options.debugMode ? "inherit" : "pipe",
        encoding: "utf8",
      });
      logger.success("✓ Frontend built successfully");
    } else if (stackExists) {
      logger.info(
        "⏭️  Skipping frontend build (stack exists but is not in healthy state)",
      );
      logger.info(
        "   Stack must be successfully deployed before frontend can be built",
      );
    } else {
      logger.info(
        "⏭️  Skipping frontend build (first deployment - backend must be deployed first)",
      );
      logger.info(
        "   Frontend will be built and deployed after backend is ready",
      );
    }
  } catch (error: any) {
    logger.error(`Build failed: ${error.message}`);
    if (error.stdout) logger.error(`Output: ${error.stdout}`);
    if (error.stderr) logger.error(`Error output: ${error.stderr}`);
    throw new Error(
      "Pre-deployment build failed. Cannot continue with deployment.",
    );
  }

  // Initialize remaining clients
  const s3 = new S3({ region });
  // Will be set after resolver compilation; passed to CloudFormation as a parameter
  let resolversBuildHash: string | undefined = undefined;

  // Set up IAM role
  const iamManager = new IamManager(region);
  const roleArn = await iamManager.setupRole(
    StackType.AwsExample,
    options.stage,
    templateBucketName,
  );
  if (!roleArn) {
    throw new Error("Failed to setup role for AWS Example");
  }

  // Wait for IAM role to propagate
  logger.debug("Waiting 10 seconds for IAM role to propagate...");
  await sleep(10000);

  try {
    // Create S3 bucket for templates if it doesn't exist
    const s3BucketManager = new S3BucketManager(region);

    // Make multiple attempts to ensure the bucket exists
    let bucketExists = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (options.debugMode) {
        logger.debug(
          `Attempt ${attempt}/3 to ensure bucket ${templateBucketName} exists...`,
        );
      }
      bucketExists =
        await s3BucketManager.ensureBucketExists(templateBucketName);

      if (bucketExists) {
        logger.debug(
          `Bucket ${templateBucketName} exists and is accessible (attempt ${attempt})`,
        );
        break;
      }

      logger.warning(
        `Bucket operation failed on attempt ${attempt}, retrying...`,
      );
      await sleep(3000 * attempt); // Exponential backoff
    }

    if (!bucketExists) {
      throw new Error(
        `Failed to ensure template bucket ${templateBucketName} exists after multiple attempts`,
      );
    }

    // Configure bucket for public access block and versioning
    try {
      const putBucketPublicAccessBlockCommand = new PutPublicAccessBlockCommand(
        {
          Bucket: templateBucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            IgnorePublicAcls: true,
            BlockPublicPolicy: true,
            RestrictPublicBuckets: true,
          },
        },
      );

      await s3.send(putBucketPublicAccessBlockCommand);
      if (options.debugMode) {
        logger.debug(`Set public access block on bucket ${templateBucketName}`);
      }

      const putBucketVersioningCommand = new PutBucketVersioningCommand({
        Bucket: templateBucketName,
        VersioningConfiguration: {
          Status: "Enabled",
        },
      });

      await s3.send(putBucketVersioningCommand);
      if (options.debugMode) {
        logger.debug(`Enabled versioning on bucket ${templateBucketName}`);
      }
    } catch (configError: any) {
      logger.warning(`Error configuring bucket: ${configError.message}`);
      // Continue despite configuration errors
    }

    if (options.debugMode) {
      logger.debug(`Template bucket ${templateBucketName} is ready for use`);
    }

    // Upload main CloudFormation template
    const mainTemplateS3Key = "cfn-template.yaml";
    const templateUrl = `https://s3.${region}.amazonaws.com/${templateBucketName}/${mainTemplateS3Key}`;

    if (options.debugMode) {
      logger.debug(
        `Uploading main template to s3://${templateBucketName}/${mainTemplateS3Key}`,
      );
    }
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: templateBucketName,
          Key: mainTemplateS3Key,
          Body: createReadStream(TEMPLATE_PATHS[StackType.AwsExample]),
          ContentType: "application/x-yaml",
        }),
      );
      logger.debug("Main template uploaded successfully.");
    } catch (error: any) {
      throw new Error(`Failed to upload main template: ${error.message}`);
    }

    // Clear existing templates and verify bucket is writable
    if (options.debugMode) {
      logger.debug("Clearing existing templates...");
    }
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: templateBucketName,
        Prefix: "resources/",
      });
      const existingObjects = await retryOperation(() => s3.send(listCommand));
      if (options.debugMode) {
        logger.debug(
          `Found ${existingObjects.Contents?.length || 0} existing objects to delete`,
        );
      }

      if (existingObjects.Contents?.length) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: templateBucketName,
          Delete: {
            Objects: existingObjects.Contents.map((obj: _Object) => ({
              Key: obj.Key!,
            })),
          },
        });
        await retryOperation(() => s3.send(deleteCommand));
        if (options.debugMode) {
          logger.debug("Deleted existing templates");
        }
      }
    } catch (error: any) {
      logger.warning(`Error clearing templates: ${error.message}`);
      if (options.debugMode) {
        logger.debug(
          "Continuing with deployment despite template clearing error",
        );
      }
    }

    // Upload nested stack templates
    if (options.debugMode) {
      logger.debug(
        `Looking for templates in: ${TEMPLATE_RESOURCES_PATHS[StackType.AwsExample]}`,
      );
    }
    const templateFiles = findYamlFiles(
      TEMPLATE_RESOURCES_PATHS[StackType.AwsExample],
    );
    if (options.debugMode) {
      logger.debug(`Found ${templateFiles.length} template files`);
    }

    if (templateFiles.length === 0) {
      throw new Error(
        `No template files found in ${TEMPLATE_RESOURCES_PATHS[StackType.AwsExample]}`,
      );
    }

    // Track successful uploads
    const successfulUploads: string[] = [];
    const failedUploads: string[] = [];

    for (const file of templateFiles) {
      const relativePath = path.relative(
        TEMPLATE_RESOURCES_PATHS[StackType.AwsExample],
        file,
      );
      const key = relativePath.replace(/\\/g, "/"); // Ensure forward slashes for S3
      if (options.debugMode) {
        logger.debug(`Uploading ${file} to ${key}`);
      }

      const putCommand = new PutObjectCommand({
        Bucket: templateBucketName,
        Key: key,
        Body: createReadStream(file),
        ContentType: "application/x-yaml",
      });

      try {
        await retryOperation(async () => {
          await s3.send(putCommand);
          if (options.debugMode) {
            logger.debug(`Uploaded template: ${key}`);
          }
          successfulUploads.push(key);
        });
      } catch (error: any) {
        logger.error(`Failed to upload template ${key}: ${error.message}`);
        failedUploads.push(key);
      }
    }

    // Verify crucial templates were uploaded
    if (failedUploads.length > 0) {
      logger.warning(
        `Failed to upload ${failedUploads.length} templates: ${failedUploads.join(", ")}`,
      );

      // Check if AppSync template was uploaded, as it's crucial for resolvers
      const appSyncTemplateKey = "resources/AppSync/appsync.yaml";
      if (failedUploads.includes(appSyncTemplateKey)) {
        throw new Error(
          `Failed to upload critical AppSync template: ${appSyncTemplateKey}`,
        );
      }
    }

    logger.debug(
      `Successfully uploaded ${successfulUploads.length} template files`,
    );

    // Upload GraphQL schema file
    logger.debug("Uploading GraphQL schema file...");
    const schemaPath = path.join(
      __dirname,
      "../../../aws-example/backend/combined_schema.graphql",
    );

    if (existsSync(schemaPath)) {
      const schemaUploadCommand = new PutObjectCommand({
        Bucket: templateBucketName,
        Key: "schema.graphql",
        Body: createReadStream(schemaPath),
        ContentType: "application/graphql",
      });

      try {
        await retryOperation(async () => {
          await s3.send(schemaUploadCommand);
          logger.debug("GraphQL schema uploaded successfully");
        });
      } catch (error: any) {
        logger.error(`Failed to upload GraphQL schema: ${error.message}`);
        throw new Error(
          "GraphQL schema upload failed - deployment cannot continue",
        );
      }
    } else {
      throw new Error(`GraphQL schema file not found at ${schemaPath}`);
    }

    // Compile Lambda functions
    if (options.debugMode) {
      logger.debug("Compiling Lambda functions...");
    }

    const lambdaSourceDir = path.join(
      __dirname,
      "../../../aws-example/backend/lambda",
    );
    // Use a repo-local cache for generated Lambda artifacts to avoid committing them
    const lambdaOutputDir = path.join(
      __dirname,
      "../../../..",
      ".cache",
      "deploy",
      "aws-example",
      "functions",
    );

    logger.info(`Looking for Lambda functions in: ${lambdaSourceDir}`);

    if (existsSync(lambdaSourceDir)) {
      logger.success(`Lambda directory found: ${lambdaSourceDir}`);

      const lambdaCompiler = new LambdaCompiler({
        logger: logger,
        baseLambdaDir: lambdaSourceDir,
        outputDir: lambdaOutputDir,
        s3BucketName: templateBucketName,
        s3KeyPrefix: "functions",
        stage: options.stage,
        region: region,
        debugMode: options.debugMode,
      });

      try {
        await lambdaCompiler.compileLambdaFunctions();
        logger.success("✓ Lambda functions compiled and uploaded successfully");
      } catch (error: any) {
        logger.error(`Lambda compilation failed: ${error.message}`);
        throw error;
      }
    } else {
      logger.warning(
        `Lambda directory not found at ${lambdaSourceDir}. Skipping Lambda compilation.`,
      );
    }

    // Compile and upload TypeScript resolvers
    if (options.debugMode) {
      logger.debug("Compiling and uploading AppSync resolvers...");
    }

    // Double-check that the bucket exists before compiling and uploading resolvers
    const bucketExistsBeforeResolvers =
      await s3BucketManager.ensureBucketExists(templateBucketName);
    if (!bucketExistsBeforeResolvers) {
      throw new Error(
        `Template bucket ${templateBucketName} not accessible before resolver compilation`,
      );
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

    const resolverDir = path.join(
      __dirname,
      "../../../aws-example/backend/resolvers",
    );

    logger.info(`Looking for resolvers in: ${resolverDir}`);

    if (existsSync(resolverDir)) {
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
        // Define constants directory path for aws-example
        const constantsDir = path.join(
          __dirname,
          "../../../aws-example/backend/constants",
        );

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

        // Use the outer-scoped resolversBuildHash so it is available when building CloudFormation parameters
        resolversBuildHash = "";
        try {
          // Compile and upload resolvers (returns build hash)
          resolversBuildHash =
            await resolverCompiler.compileAndUploadResolvers();

          // Verify that the resolvers were uploaded successfully
          if (options.debugMode) {
            logger.debug("Verifying resolver uploads...");
          }

          // First verification: Check using ListObjectsV2
          // List objects under the specific build hash prefix to verify uploads
          const hashedPrefix = `resolvers/${options.stage}/${resolversBuildHash}/`;
          const listCommand = new ListObjectsV2Command({
            Bucket: templateBucketName,
            Prefix: hashedPrefix,
          });

          let retryCount = 0;
          let resolverCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              const listedObjects = await s3.send(listCommand);
              // Properly type the response from ListObjectsV2Command
              const listObjectsResult = listedObjects as {
                Contents?: Array<{ Key: string }>;
              };
              resolverCount = listObjectsResult.Contents?.length || 0;

              if (resolverCount > 0) {
                logger.debug(
                  `Verified ${resolverCount} resolvers were uploaded to S3`,
                );
                break;
              } else {
                logger.warning(
                  `No resolvers found in S3 (attempt ${retryCount + 1}/${maxRetries}). Waiting and retrying...`,
                );
                await sleep(5000); // Wait 5 seconds before retrying
                retryCount++;
              }
            } catch (error: any) {
              logger.error(
                `Error verifying resolver uploads (attempt ${retryCount + 1}/${maxRetries}): ${error.message}`,
              );
              await sleep(5000);
              retryCount++;
            }
          }

          if (resolverCount === 0) {
            throw new Error(
              "No resolvers were uploaded to S3. Deployment will fail.",
            );
          }
        } catch (error: any) {
          logger.error(
            `Resolver compilation and upload failed: ${error.message}`,
          );
          throw error;
        }
      }
    } else {
      const errorMsg = `Resolver directory not found at ${resolverDir}. This will cause deployment to fail if resolvers are referenced in AppSync template.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Get KMS Key info from shared stack outputs
    const sharedStackData = await cfn.send(
      new DescribeStacksCommand({
        StackName: getStackName(StackType.Shared, options.stage),
      }),
    );

    const kmsKeyId = sharedStackData.Stacks?.[0]?.Outputs?.find(
      (output) => output.OutputKey === "KMSKeyId",
    )?.OutputValue;

    const kmsKeyArn = sharedStackData.Stacks?.[0]?.Outputs?.find(
      (output) => output.OutputKey === "KMSKeyArn",
    )?.OutputValue;

    if (!kmsKeyId || !kmsKeyArn) {
      throw new Error("Failed to get KMS key information from shared stack");
    }

    // Use OutputsManager to get values from other stacks
    const outputsManager = new OutputsManager();

    // Get WAF Web ACL ID and ARN
    const webAclId = await outputsManager.getOutputValue(
      StackType.WAF,
      options.stage,
      "WebACLId",
    );
    const webAclArn = await outputsManager.getOutputValue(
      StackType.WAF,
      options.stage,
      "WebACLArn",
    );

    if (!webAclId || !webAclArn) {
      throw new Error(
        "Failed to get WAF Web ACL information from WAF stack outputs",
      );
    }

    // Create or update the CloudFormation stack
    const stackTemplateUrl = `https://s3.${region}.amazonaws.com/${templateBucketName}/${mainTemplateS3Key}`;
    const stackParams: Parameter[] = [
      { ParameterKey: "Stage", ParameterValue: options.stage },
      {
        ParameterKey: "TemplateBucketName",
        ParameterValue: templateBucketName,
      },
      { ParameterKey: "KMSKeyId", ParameterValue: kmsKeyId },
      { ParameterKey: "KMSKeyArn", ParameterValue: kmsKeyArn },
      { ParameterKey: "WebACLId", ParameterValue: webAclId },
      { ParameterKey: "WebACLArn", ParameterValue: webAclArn },
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

    // Log the parameters we will pass to CloudFormation for debugging
    try {
      logger.debug(
        `Computed CloudFormation parameters for AwsExample: ${JSON.stringify(
          stackParams,
          null,
          2,
        )}`,
      );

      // Validate required parameters to fail fast with a clear message if anything is missing
      const requiredKeys = [
        "Stage",
        "TemplateBucketName",
        "KMSKeyId",
        "KMSKeyArn",
        "WebACLId",
        "WebACLArn",
      ];

      const missing = requiredKeys.filter(
        (k) =>
          !stackParams.some((p) => p.ParameterKey === k && p.ParameterValue),
      );

      if (missing.length > 0) {
        throw new Error(
          `Missing required CloudFormation parameters for AwsExample: ${missing.join(", ")}. Computed parameters: ${JSON.stringify(
            stackParams,
          )}`,
        );
      }

      // Check if the stack exists
      let stackExists = false;
      try {
        const describeResponse = await cfn.send(
          new DescribeStacksCommand({ StackName: stackName }),
        );
        stackExists = !!(
          describeResponse.Stacks && describeResponse.Stacks.length > 0
        );
      } catch (describeError: any) {
        // Stack doesn't exist if we get an error
        if (
          describeError.name === "ValidationError" ||
          describeError.message?.includes("does not exist")
        ) {
          stackExists = false;
        } else {
          throw describeError;
        }
      }

      if (stackExists) {
        logger.info("Updating existing CloudFormation stack...");
        await cfn.send(
          new UpdateStackCommand({
            StackName: stackName,
            TemplateURL: stackTemplateUrl,
            Parameters: stackParams,
            Capabilities: [Capability.CAPABILITY_NAMED_IAM],
            RoleARN: roleArn,
          }),
        );

        // Wait for update to complete
        const stopUpdateSpinner = logger.infoWithSpinner(
          "Waiting for stack update to complete...",
        );
        await waitForStackCompletion(cfn, stackName, "UPDATE");
        stopUpdateSpinner();
      } else {
        logger.info("Creating new CloudFormation stack...");
        await cfn.send(
          new CreateStackCommand({
            StackName: stackName,
            TemplateURL: stackTemplateUrl,
            Parameters: stackParams,
            Capabilities: [Capability.CAPABILITY_NAMED_IAM],
            RoleARN: roleArn,
          }),
        );

        // Wait for creation to complete
        const stopCreateSpinner = logger.infoWithSpinner(
          "Waiting for stack creation to complete...",
        );
        await waitForStackCompletion(cfn, stackName, "CREATE");
        stopCreateSpinner();
      }

      logger.success(
        `CloudFormation stack ${stackName} deployed/updated successfully`,
      );

      // TODO: Add user seeding script for aws-example if needed
      // For now, we'll skip this step as it's specific to the application
      logger.info("⏭️  User seeding not yet configured for AWS Example");
    } catch (cfnError: any) {
      logger.error(`CloudFormation deployment failed: ${cfnError.message}`);
      throw cfnError;
    }
  } catch (error: any) {
    logger.error(`Deployment failed: ${error.message}`);
    throw error;
  } finally {
    stopSpinner();
  }
}
