import {
  CloudFormationClient,
  Parameter,
  Capability,
  CreateStackCommand,
  UpdateStackCommand,
  DescribeStacksCommand,
  DescribeStackEventsCommand,
  DeleteStackCommand,
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
  CloudFrontClient,
  GetDistributionConfigCommand,
  UpdateDistributionCommand,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import {
  DeploymentOptions,
  StackType,
  TEMPLATE_RESOURCES_PATHS,
  getStackName,
  getTemplateBucketName,
  TEMPLATE_PATHS,
} from "../../types";
import { logger, setLogFile, closeLogFile } from "../../utils/logger";
import { IamManager } from "../../utils/iam-manager";
import { ResolverCompiler } from "../../utils/resolver-compiler";
import { LambdaCompiler } from "../../utils/lambda-compiler";
import { S3BucketManager } from "../../utils/s3-bucket-manager";
import { OutputsManager } from "../../outputs-manager";
import { candidateExportNames } from "../../utils/export-names";
import { seedDB } from "../../utils/seed-db";
import { addAppSyncBucketPolicy } from "../../utils/s3-resolver-validator";
import { cleanupLogGroups } from "../../utils/loggroup-cleanup";
import { createReadStream, readdirSync, statSync, existsSync } from "fs";
import { rm } from "fs/promises";
import * as path from "path";
import { execSync } from "child_process";
import { UserSetupManager } from "../../utils/user-setup";

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

// Deploy DNS stack to us-east-1 (ACM certificates for CloudFront must be in us-east-1)
async function deployDNSStack(
  domainName: string,
  hostedZoneId: string,
  stage: string,
  cloudFrontDomainName?: string,
): Promise<string> {
  const region = "us-east-1"; // ACM certs for CloudFront MUST be in us-east-1
  const cfn = new CloudFormationClient({ region });
  const s3 = new S3({ region });
  const stackName = `nlmonorepo-thestoryhub-dns-${stage}`;
  const templateBucketName = `nlmonorepo-thestoryhub-dns-templates-${stage}`;

  logger.info(`📋 Deploying DNS stack to us-east-1 for domain: ${domainName}`);

  // Create S3 bucket for DNS template in us-east-1
  const s3BucketManager = new S3BucketManager(region);
  const bucketExists =
    await s3BucketManager.ensureBucketExists(templateBucketName);
  if (!bucketExists) {
    throw new Error(
      `Failed to create DNS template bucket ${templateBucketName} in us-east-1`,
    );
  }

  // Upload DNS template to S3
  const dnsTemplatePath = path.join(
    __dirname,
    "../../templates/the-story-hub/resources/DNS/dns.yaml",
  );
  const dnsTemplateKey = "dns.yaml";

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: templateBucketName,
        Key: dnsTemplateKey,
        Body: createReadStream(dnsTemplatePath),
        ContentType: "application/x-yaml",
      }),
    );
    logger.debug("DNS template uploaded to us-east-1");
  } catch (error: any) {
    throw new Error(`Failed to upload DNS template: ${error.message}`);
  }

  // Prepare CloudFormation parameters
  const stackParams: Parameter[] = [
    { ParameterKey: "Stage", ParameterValue: stage },
    { ParameterKey: "DomainName", ParameterValue: domainName },
    { ParameterKey: "HostedZoneId", ParameterValue: hostedZoneId },
    {
      ParameterKey: "CloudFrontDomainName",
      ParameterValue: cloudFrontDomainName || "",
    },
  ];

  const templateUrl = `https://s3.${region}.amazonaws.com/${templateBucketName}/${dnsTemplateKey}`;

  // Check if stack exists
  let stackExists = false;
  try {
    const describeResponse = await cfn.send(
      new DescribeStacksCommand({ StackName: stackName }),
    );
    stackExists = !!(
      describeResponse.Stacks && describeResponse.Stacks.length > 0
    );
  } catch (error: any) {
    if (
      error.name === "ValidationError" ||
      error.message?.includes("does not exist")
    ) {
      stackExists = false;
    } else {
      throw error;
    }
  }

  // Create or update stack
  if (stackExists) {
    logger.info(`Updating DNS stack in us-east-1...`);
    try {
      await cfn.send(
        new UpdateStackCommand({
          StackName: stackName,
          TemplateURL: templateUrl,
          Parameters: stackParams,
          Capabilities: [Capability.CAPABILITY_NAMED_IAM],
        }),
      );
      await waitForStackCompletion(cfn, stackName, "UPDATE");
    } catch (error: any) {
      if (error.message?.includes("No updates are to be performed")) {
        logger.info("DNS stack is already up to date");
      } else {
        throw error;
      }
    }
  } else {
    logger.info(`Creating DNS stack in us-east-1...`);
    logger.info(
      `⏳ This may take 5-10 minutes for ACM certificate validation...`,
    );
    await cfn.send(
      new CreateStackCommand({
        StackName: stackName,
        TemplateURL: templateUrl,
        Parameters: stackParams,
        Capabilities: [Capability.CAPABILITY_NAMED_IAM],
      }),
    );
    await waitForStackCompletion(cfn, stackName, "CREATE");
  }

  // Get certificate ARN from stack outputs
  const stackData = await cfn.send(
    new DescribeStacksCommand({ StackName: stackName }),
  );
  const certificateArn = stackData.Stacks?.[0]?.Outputs?.find(
    (output) => output.OutputKey === "CertificateArn",
  )?.OutputValue;

  if (!certificateArn) {
    throw new Error("Failed to get Certificate ARN from DNS stack outputs");
  }

  logger.success(`✓ DNS stack deployed successfully in us-east-1`);
  logger.info(`📜 Certificate ARN: ${certificateArn}`);

  return certificateArn;
}

// Update CloudFront distribution with custom domain and certificate
async function updateCloudFrontWithDomain(
  distributionId: string,
  certificateArn: string,
  domainName: string,
): Promise<void> {
  const cloudfront = new CloudFrontClient({ region: "us-east-1" }); // CloudFront is global but API is in us-east-1

  logger.info(`☁️  Updating CloudFront distribution ${distributionId}...`);

  // Get current distribution configuration
  const getConfigResponse = await cloudfront.send(
    new GetDistributionConfigCommand({ Id: distributionId }),
  );

  const config = getConfigResponse.DistributionConfig;
  const etag = getConfigResponse.ETag;

  if (!config || !etag) {
    throw new Error("Failed to get CloudFront distribution configuration");
  }

  // Update configuration with custom domain and certificate
  config.Aliases = {
    Quantity: 2,
    Items: [domainName, `www.${domainName}`],
  };

  config.ViewerCertificate = {
    ACMCertificateArn: certificateArn,
    SSLSupportMethod: "sni-only",
    MinimumProtocolVersion: "TLSv1.2_2021",
    Certificate: certificateArn,
    CertificateSource: "acm",
  };

  // Update the distribution
  await cloudfront.send(
    new UpdateDistributionCommand({
      Id: distributionId,
      DistributionConfig: config,
      IfMatch: etag,
    }),
  );

  logger.success(
    `✓ CloudFront distribution updated with custom domain: ${domainName}`,
  );
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

  // Track event IDs we've already logged to avoid duplicates
  const loggedEventIds = new Set<string>();
  // Track nested stacks we've discovered
  const nestedStacks = new Set<string>();

  // Helper function to fetch and log events from a stack (including nested stacks)
  const fetchStackEvents = async (
    targetStackName: string,
    isNested: boolean = false,
  ) => {
    try {
      const eventsResponse = await cfn.send(
        new DescribeStackEventsCommand({ StackName: targetStackName }),
      );

      if (eventsResponse.StackEvents) {
        // Events come newest first, reverse to show chronologically
        const newEvents = eventsResponse.StackEvents.filter(
          (event) => event.EventId && !loggedEventIds.has(event.EventId),
        ).reverse();

        for (const event of newEvents) {
          if (event.EventId) {
            loggedEventIds.add(event.EventId);

            const timestamp = event.Timestamp?.toISOString() || "unknown";
            const resourceType = event.ResourceType || "Unknown";
            const logicalId = event.LogicalResourceId || "Unknown";
            const resourceStatus = event.ResourceStatus || "Unknown";
            const statusReason = event.ResourceStatusReason || "";

            // Track nested stacks for recursive event fetching
            if (
              resourceType === "AWS::CloudFormation::Stack" &&
              event.PhysicalResourceId
            ) {
              const nestedStackId = event.PhysicalResourceId;
              if (!nestedStacks.has(nestedStackId)) {
                nestedStacks.add(nestedStackId);
                logger.debug(
                  `Discovered nested stack: ${logicalId} (${nestedStackId})`,
                );
              }
            }

            // Add prefix for nested stack events
            const prefix = isNested
              ? `[NESTED:${targetStackName.split("/")[1] || targetStackName}] `
              : "";

            // Log based on status
            if (resourceStatus.includes("FAILED")) {
              logger.error(
                `[CFN] ${prefix}${timestamp} | ${resourceType} | ${logicalId} | ${resourceStatus} | ${statusReason}`,
              );
            } else if (resourceStatus.includes("COMPLETE")) {
              logger.success(
                `[CFN] ${prefix}${timestamp} | ${resourceType} | ${logicalId} | ${resourceStatus}`,
              );
            } else {
              logger.info(
                `[CFN] ${prefix}${timestamp} | ${resourceType} | ${logicalId} | ${resourceStatus}`,
              );
            }
          }
        }
      }
    } catch (eventsError: any) {
      // Don't warn for nested stacks that might have been deleted
      if (!isNested) {
        logger.warning(
          `Failed to fetch CloudFormation events from ${targetStackName}: ${eventsError.message}`,
        );
      }
    }
  };

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

      // Fetch and log CloudFormation events from main stack
      await fetchStackEvents(stackName, false);

      // Fetch events from all discovered nested stacks
      for (const nestedStackId of nestedStacks) {
        await fetchStackEvents(nestedStackId, true);
      }

      if (status === successStatus) {
        logger.success(
          `Stack ${stackName} ${operation.toLowerCase()} completed successfully`,
        );
        return;
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

export async function deployTheStoryHub(
  options: DeploymentOptions & { domainName?: string; hostedZoneId?: string },
): Promise<void> {
  // Cache is cleared at the main() entry point in index.ts
  // Logging is set up in the deploy menu in index.ts

  const stackName = getStackName(StackType.TheStoryHub, options.stage);
  const templateBucketName = getTemplateBucketName(
    StackType.TheStoryHub,
    options.stage,
  );

  const stopSpinner = logger.infoWithSpinner(
    "Starting AWS Example stack deployment in ap-southeast-2",
  );

  const region = options.region || process.env.AWS_REGION || "ap-southeast-2";

  // Deploy DNS stack first if domain configuration is provided (prod only)
  let certificateArn: string | undefined;
  if (options.domainName && options.hostedZoneId && options.stage === "prod") {
    try {
      logger.info(`🌐 Domain configuration detected for ${options.domainName}`);
      logger.info(
        `📋 Deploying DNS stack to us-east-1 (ACM certificates for CloudFront must be in us-east-1)`,
      );

      // First deployment: Create certificate without CloudFront domain
      certificateArn = await deployDNSStack(
        options.domainName,
        options.hostedZoneId,
        options.stage,
        undefined, // CloudFront domain not available yet
      );

      logger.success(
        `✓ DNS stack deployed with certificate: ${certificateArn.substring(0, 50)}...`,
      );
    } catch (error: any) {
      logger.error(`Failed to deploy DNS stack: ${error.message}`);
      logger.error(
        `Deployment cannot continue without DNS configuration. Please fix the issue and try again.`,
      );
      throw error;
    }
  }

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
    const frontendPath = path.join(
      __dirname,
      "../../../the-story-hub/frontend",
    );

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
    StackType.TheStoryHub,
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
          Body: createReadStream(TEMPLATE_PATHS[StackType.TheStoryHub]),
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
        `Looking for templates in: ${TEMPLATE_RESOURCES_PATHS[StackType.TheStoryHub]}`,
      );
    }
    const templateFiles = findYamlFiles(
      TEMPLATE_RESOURCES_PATHS[StackType.TheStoryHub],
    );
    if (options.debugMode) {
      logger.debug(`Found ${templateFiles.length} template files`);
    }

    if (templateFiles.length === 0) {
      throw new Error(
        `No template files found in ${TEMPLATE_RESOURCES_PATHS[StackType.TheStoryHub]}`,
      );
    }

    // Track successful uploads
    const successfulUploads: string[] = [];
    const failedUploads: string[] = [];

    for (const file of templateFiles) {
      const relativePath = path.relative(
        TEMPLATE_RESOURCES_PATHS[StackType.TheStoryHub],
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

    // Upload GraphQL schema file with content-based versioning
    logger.debug("Uploading GraphQL schema file...");
    const schemaPath = path.join(
      __dirname,
      "../../../the-story-hub/backend/combined_schema.graphql",
    );

    let schemaHash = "";
    if (existsSync(schemaPath)) {
      // Calculate hash of schema content for versioning
      const crypto = require("crypto");
      const fs = require("fs");
      const schemaContent = fs.readFileSync(schemaPath, "utf8");
      schemaHash = crypto
        .createHash("sha256")
        .update(schemaContent)
        .digest("hex")
        .substring(0, 16); // Use first 16 chars of hash

      const schemaKey = `schema-${schemaHash}.graphql`;
      logger.debug(`Schema hash: ${schemaHash}, uploading as ${schemaKey}`);

      const schemaUploadCommand = new PutObjectCommand({
        Bucket: templateBucketName,
        Key: schemaKey,
        Body: createReadStream(schemaPath),
        ContentType: "application/graphql",
      });

      try {
        await retryOperation(async () => {
          await s3.send(schemaUploadCommand);
          logger.debug(
            `GraphQL schema uploaded successfully with hash ${schemaHash}`,
          );
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
      "../../../the-story-hub/backend/lambda",
    );
    // Use a repo-local cache for generated Lambda artifacts to avoid committing them
    const lambdaOutputDir = path.join(
      __dirname,
      "../../../..",
      ".cache",
      "deploy",
      "the-story-hub",
      "functions",
    );

    if (options.skipResolversBuild) {
      logger.info(
        "⏭️  Skipping Lambda function compilation (--build-resolvers=false)",
      );
    } else {
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
          // Clean up previous Lambda cache before compilation
          await lambdaCompiler.clean();

          await lambdaCompiler.compileLambdaFunctions();
          logger.success(
            "✓ Lambda functions compiled and uploaded successfully",
          );
        } catch (error: any) {
          logger.error(`Lambda compilation failed: ${error.message}`);
          throw error;
        }
      } else {
        logger.warning(
          `Lambda directory not found at ${lambdaSourceDir}. Skipping Lambda compilation.`,
        );
      }
    }

    // Compile and upload TypeScript resolvers
    if (options.debugMode) {
      logger.debug("Compiling and uploading AppSync resolvers...");
    }

    if (options.skipResolversBuild) {
      logger.info(
        "⏭️  Skipping resolver compilation (--build-resolvers=false)",
      );
      logger.info("Fetching latest resolver build hash from S3...");

      // Get the latest resolver build hash from S3
      const resolverPrefix = `resolvers/${options.stage}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: templateBucketName,
        Prefix: resolverPrefix,
        Delimiter: "/",
      });

      const listedObjects = await s3.send(listCommand);
      const commonPrefixes = listedObjects.CommonPrefixes || [];

      if (commonPrefixes.length === 0) {
        throw new Error(
          `No existing resolver builds found in S3 at ${resolverPrefix}. Cannot skip resolver build - you must build at least once.`,
        );
      }

      // Extract build hashes from common prefixes
      const buildHashes = commonPrefixes
        .map((cp) => {
          const prefix = cp.Prefix || "";
          return prefix.replace(resolverPrefix, "").replace("/", "");
        })
        .filter((hash) => hash.length > 0);

      if (buildHashes.length === 0) {
        throw new Error(
          `No valid resolver build hashes found in S3. Cannot skip resolver build.`,
        );
      }

      // Use the most recent build hash (last in alphabetical order since they're timestamps)
      resolversBuildHash = buildHashes.sort().pop();
      logger.success(
        `Using existing resolver build hash: ${resolversBuildHash}`,
      );
    } else {
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
        "../../../the-story-hub/backend/resolvers",
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
          // Define constants directory path for the-story-hub
          const constantsDir = path.join(
            __dirname,
            "../../../the-story-hub/backend/constants",
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
    }

    // KMS encryption removed - no need to get keys from Shared stack

    // Create or update the CloudFormation stack
    const stackTemplateUrl = `https://s3.${region}.amazonaws.com/${templateBucketName}/${mainTemplateS3Key}`;
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

    // Domain configuration parameters (optional, for prod with custom domain)
    // Note: These are passed to main template but not currently used by nested stacks
    // Certificate and domain are handled by separate DNS stack in us-east-1
    if (options.domainName) {
      stackParams.push({
        ParameterKey: "DomainName",
        ParameterValue: options.domainName,
      });
    }
    if (options.hostedZoneId) {
      stackParams.push({
        ParameterKey: "HostedZoneId",
        ParameterValue: options.hostedZoneId,
      });
    }

    // Log the parameters we will pass to CloudFormation for debugging
    try {
      logger.debug(
        `Computed CloudFormation parameters for TheStoryHub: ${JSON.stringify(
          stackParams,
          null,
          2,
        )}`,
      );

      // Validate required parameters to fail fast with a clear message if anything is missing
      const requiredKeys = ["Stage", "TemplateBucketName"];

      const missing = requiredKeys.filter(
        (k) =>
          !stackParams.some((p) => p.ParameterKey === k && p.ParameterValue),
      );

      if (missing.length > 0) {
        throw new Error(
          `Missing required CloudFormation parameters for TheStoryHub: ${missing.join(", ")}. Computed parameters: ${JSON.stringify(
            stackParams,
          )}`,
        );
      }

      // Clean up any orphaned LogGroups before deployment
      await cleanupLogGroups({
        appName: "tsh",
        stage: options.stage,
        region: region,
      });

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
        const createCommand: any = {
          StackName: stackName,
          TemplateURL: stackTemplateUrl,
          Parameters: stackParams,
          Capabilities: [Capability.CAPABILITY_NAMED_IAM],
          RoleARN: roleArn,
        };

        // Add DisableRollback if option is set (default: false)
        if (options.disableRollback) {
          createCommand.DisableRollback = true;
          logger.info(
            "DisableRollback is enabled - stack will not rollback on failure",
          );
        }

        await cfn.send(new CreateStackCommand(createCommand));

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

      // Save stack outputs to deployment-outputs.json
      try {
        logger.info("💾 Saving stack outputs to deployment-outputs.json...");
        const outputsManager = new OutputsManager();
        await outputsManager.saveStackOutputs(
          StackType.TheStoryHub,
          options.stage,
          region,
        );
        logger.success("✓ Stack outputs saved successfully");
      } catch (outputsError: any) {
        logger.error(
          `Failed to save stack outputs: ${outputsError instanceof Error ? outputsError.message : outputsError}`,
        );
        // don't throw - this is non-critical
      }

      // Update CloudFront and DNS for custom domain (second phase)
      if (
        certificateArn &&
        options.domainName &&
        options.hostedZoneId &&
        options.stage === "prod"
      ) {
        try {
          logger.info(`🌐 Configuring custom domain for CloudFront...`);

          // Get CloudFront distribution ID and domain from stack outputs
          const stackOutputs = await cfn.send(
            new DescribeStacksCommand({ StackName: stackName }),
          );
          const cloudFrontDomain = stackOutputs.Stacks?.[0]?.Outputs?.find(
            (output) => output.OutputKey === "CloudFrontDomainName",
          )?.OutputValue;
          const cloudFrontDistributionId =
            stackOutputs.Stacks?.[0]?.Outputs?.find(
              (output) => output.OutputKey === "CloudFrontDistributionId",
            )?.OutputValue;

          if (cloudFrontDomain && cloudFrontDistributionId) {
            logger.info(`📡 CloudFront domain: ${cloudFrontDomain}`);
            logger.info(`🆔 Distribution ID: ${cloudFrontDistributionId}`);

            // Update CloudFront distribution with certificate and custom domains
            await updateCloudFrontWithDomain(
              cloudFrontDistributionId,
              certificateArn,
              options.domainName,
            );

            // Update DNS stack with CloudFront domain to create Route53 records
            await deployDNSStack(
              options.domainName,
              options.hostedZoneId,
              options.stage,
              cloudFrontDomain,
            );

            logger.success(`✓ Custom domain configuration complete!`);
            logger.info(`🌍 Your site will be accessible at:`);
            logger.info(`   - https://${options.domainName}`);
            logger.info(`   - https://www.${options.domainName}`);
            logger.info(
              `   - https://${cloudFrontDomain} (CloudFront default domain)`,
            );
            logger.info(
              `⏳ Note: CloudFront distribution update may take 15-20 minutes to propagate globally`,
            );
          } else {
            logger.warning(
              `Could not find CloudFront outputs. Domain configuration incomplete.`,
            );
          }
        } catch (error: any) {
          logger.error(`Failed to configure custom domain: ${error.message}`);
          logger.error(
            `Deployment failed during domain configuration. Please fix the issue and redeploy.`,
          );
          throw error;
        }
      }

      // Build frontend if it wasn't built yet and stack is now healthy
      const frontendOutPath = path.join(
        __dirname,
        "../../../the-story-hub/frontend/out",
      );
      const frontendPath = path.join(
        __dirname,
        "../../../the-story-hub/frontend",
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
            logger.info(
              "🏗️  Building frontend application (post-deployment)...",
            );
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

      // Run seeding and admin-user creation for AWS Example (if possible)
      try {
        const repoRoot = path.join(__dirname, "../../../../");
        logger.info(
          "🌱 Seeding TSH users into DynamoDB (shell script, with AWS env)...",
        );

        try {
          // Programmatic seeding: prefer parameterized deployment outputs lookup
          const outputsManagerForSeed = new OutputsManager();
          const candidates = candidateExportNames(
            StackType.TheStoryHub,
            options.stage,
            "datatable-name",
          );

          let tableName =
            (await outputsManagerForSeed.findOutputValueByCandidates(
              options.stage,
              candidates,
            )) ||
            (await outputsManagerForSeed.getOutputValue(
              StackType.TheStoryHub,
              options.stage,
              "DataTableName",
            )) ||
            `nlmonorepo-thestoryhub-datatable-${options.stage}`;

          logger.info(
            "🌱 Seeding TSH users into DynamoDB (programmatic seeder)...",
          );

          try {
            await seedDB({
              region,
              tableName,
              stage: options.stage,
              appName: "the-story-hub",
              skipConfirmation: true,
            });
            logger.success("✓ TSH user table seeded successfully");
          } catch (seedError: any) {
            logger.error(
              `TSH user seeding failed: ${seedError instanceof Error ? seedError.message : seedError}`,
            );
            // keep previous behavior: do not throw here - admin creation may still be desirable
          }
        } catch (seedOuterErr: any) {
          logger.error(
            `TSH seeding orchestration failed: ${seedOuterErr instanceof Error ? seedOuterErr.message : seedOuterErr}`,
          );
        }

        // Attempt to create admin user in Cognito (if admin email provided or set in env)
        try {
          const region =
            options.region || process.env.AWS_REGION || "ap-southeast-2";
          const adminEmail = options.adminEmail || process.env.ADMIN_EMAIL;
          if (!adminEmail) {
            logger.info(
              "No admin email provided (options.adminEmail or ADMIN_EMAIL). Skipping Cognito admin creation.",
            );
          } else {
            logger.info(
              `👤 Creating Cognito admin user for TSH: ${adminEmail}`,
            );
            const userManager = new UserSetupManager(region, "tsh");
            await userManager.createAdminUser({
              stage: options.stage,
              adminEmail,
              region,
              stackType: "tsh",
            });
            logger.success("✓ Cognito admin user created for TSH");
          }
        } catch (userError: any) {
          logger.error(
            `TSH Cognito admin creation failed: ${userError instanceof Error ? userError.message : userError}`,
          );
          // don't throw to avoid failing the entire deploy; surface error to logs
        }

        // Update frontend environment variables from CloudFormation outputs
        try {
          logger.info("📝 Updating frontend environment variables...");
          const frontendPath = path.join(
            __dirname,
            "../../../the-story-hub/frontend",
          );
          const updateEnvScript = path.join(
            frontendPath,
            "scripts/update-env-from-aws.sh",
          );

          if (existsSync(updateEnvScript)) {
            execSync(`bash ${updateEnvScript} ${options.stage}`, {
              cwd: frontendPath,
              stdio: "inherit",
            });
            logger.success("✓ Frontend environment variables updated");
          } else {
            logger.warning(`Update env script not found at ${updateEnvScript}`);
          }
        } catch (envError: any) {
          logger.error(
            `Failed to update frontend environment variables: ${envError instanceof Error ? envError.message : envError}`,
          );
          // don't throw - this is non-critical
        }
      } catch (err) {
        logger.error(
          `TSH post-deploy tasks failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    } catch (cfnError: any) {
      logger.error(`CloudFormation deployment failed: ${cfnError.message}`);
      throw cfnError;
    }
  } catch (error: any) {
    logger.error(`Deployment failed: ${error.message}`);
    throw error;
  } finally {
    stopSpinner();
    closeLogFile();
  }
}
