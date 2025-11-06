#!/usr/bin/env ts-node
/**
 * The Story Hub Quick Deploy Script
 *
 * Non-interactive deployment script with pre-configured settings for The Story Hub dev environment.
 *
 * Usage:
 *   yarn deploy:tsh:dev
 *
 * Or with custom email:
 *   yarn deploy:tsh:dev --admin-email your.email@example.com
 *
 * Or for production:
 *   yarn deploy:tsh:dev --stage prod --skip-waf false
 */

import { config } from "dotenv";
import * as path from "path";
import { deployTheStoryHub } from "./packages/the-story-hub/deploy";
import { DeploymentOptions, StackType, getStackName } from "./types";
import { logger, setDebugMode, setLogFile } from "./utils/logger";
import { getAwsCredentials } from "./utils/aws-credentials";
import { OutputsManager } from "./outputs-manager";
import { getDependencyChain } from "./dependency-validator";
import { DeploymentManager } from "./deployment-manager";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStacksCommand,
  waitUntilStackDeleteComplete,
} from "@aws-sdk/client-cloudformation";
import {
  S3Client,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
  DeleteBucketCommand,
} from "@aws-sdk/client-s3";

// Load environment variables from mono-repo root
config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Empty and delete an S3 bucket
 */
async function emptyAndDeleteBucket(
  bucketName: string,
  region: string,
): Promise<void> {
  const s3Client = new S3Client({ region });

  try {
    logger.info(`  Emptying S3 bucket: ${bucketName}`);

    // List and delete all object versions
    let isTruncated = true;
    let keyMarker: string | undefined;
    let versionIdMarker: string | undefined;

    while (isTruncated) {
      const listResponse = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: bucketName,
          KeyMarker: keyMarker,
          VersionIdMarker: versionIdMarker,
        }),
      );

      const objects = [
        ...(listResponse.Versions || []).map((v) => ({
          Key: v.Key!,
          VersionId: v.VersionId,
        })),
        ...(listResponse.DeleteMarkers || []).map((d) => ({
          Key: d.Key!,
          VersionId: d.VersionId,
        })),
      ];

      if (objects.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: { Objects: objects },
          }),
        );
        logger.info(`    Deleted ${objects.length} objects from ${bucketName}`);
      }

      isTruncated = listResponse.IsTruncated || false;
      keyMarker = listResponse.NextKeyMarker;
      versionIdMarker = listResponse.NextVersionIdMarker;
    }

    // Delete the bucket
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    logger.success(`  ✓ Deleted S3 bucket: ${bucketName}`);
  } catch (error: any) {
    if (error.name === "NoSuchBucket" || error.Code === "NoSuchBucket") {
      logger.info(`  Bucket ${bucketName} does not exist, skipping`);
    } else {
      logger.warning(
        `  Failed to delete bucket ${bucketName}: ${error.message}`,
      );
    }
  }
}

interface CliOptions {
  stage: string;
  adminEmail: string;
  strategy: "update" | "replace";
  buildFrontend: boolean;
  buildResolvers: boolean;
  disableRollback: boolean;
  skipUserCreation: boolean;
  debug: boolean;
}

async function main() {
  // Parse command line arguments
  const argv = await yargs(hideBin(process.argv))
    .option("stage", {
      alias: "s",
      type: "string",
      description: "Deployment stage (e.g., dev, prod)",
      default: "dev",
    })
    .option("admin-email", {
      alias: "e",
      type: "string",
      description: "Admin email address for user creation",
      default: "vesnathan+tsh@gmail.com",
    })
    .option("strategy", {
      type: "string",
      description: "Deployment strategy",
      choices: ["update", "replace"] as const,
      default: "replace" as const,
    })
    .option("build-frontend", {
      alias: "b",
      type: "boolean",
      description: "Build frontend application before deployment",
      default: true,
    })
    .option("build-resolvers", {
      type: "boolean",
      description: "Build and upload resolvers and Lambda functions",
      default: true,
    })
    .option("disable-rollback", {
      alias: "r",
      type: "boolean",
      description: "Disable automatic rollback on stack creation failure",
      default: true,
    })
    .option("skip-user-creation", {
      alias: "u",
      type: "boolean",
      description: "Skip admin user creation/update (for update deployments)",
      default: false,
    })
    .option("debug", {
      alias: "d",
      type: "boolean",
      description: "Enable debug mode for detailed logging",
      default: false,
    })
    .help()
    .alias("help", "h")
    .parse();

  const options: CliOptions = {
    stage: argv.stage,
    adminEmail: argv["admin-email"],
    strategy: argv.strategy,
    buildFrontend: argv["build-frontend"],
    buildResolvers: argv["build-resolvers"],
    disableRollback: argv["disable-rollback"],
    skipUserCreation: argv["skip-user-creation"],
    debug: argv.debug,
  };

  // Set up logging
  if (options.debug) {
    setDebugMode(true);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFilePath = path.join(
    __dirname,
    "../..",
    ".cache",
    "deploy",
    "the-story-hub",
    "logs",
    `deployment-${timestamp}.log`,
  );
  setLogFile(logFilePath);

  logger.info(`🚀 The Story Hub Quick Deploy`);
  logger.info(`📝 Deployment logs: ${logFilePath}`);
  logger.info("");
  logger.info(`Configuration:`);
  logger.info(`  Stage: ${options.stage}`);
  logger.info(`  Strategy: ${options.strategy}`);
  logger.info(`  Admin Email: ${options.adminEmail}`);
  logger.info(`  Build Frontend: ${options.buildFrontend ? "Yes" : "No"}`);
  logger.info(`  Build Resolvers: ${options.buildResolvers ? "Yes" : "No"}`);
  logger.info(`  Disable Rollback: ${options.disableRollback ? "Yes" : "No"}`);
  logger.info(
    `  Skip User Creation: ${options.skipUserCreation ? "Yes" : "No"}`,
  );
  logger.info("");

  try {
    // Ensure AWS credentials are available
    await getAwsCredentials();

    const deploymentOptions: DeploymentOptions = {
      stage: options.stage,
      adminEmail: options.adminEmail,
      skipUserCreation: options.skipUserCreation,
      autoDeleteFailedStacks: true,
      skipFrontendBuild: !options.buildFrontend,
      skipResolversBuild: !options.buildResolvers,
      disableRollback: options.disableRollback,
      skipWAF: true, // Temporarily skip WAF - will add back after deployment works
      debugMode: options.debug,
    };

    if (options.strategy === "replace") {
      logger.info(
        "⚠️  Force Replace mode: Stack will be deleted if it exists, then recreated",
      );

      // Delete existing stack if it exists
      const region = process.env.AWS_REGION || "ap-southeast-2";
      const stackName = getStackName(StackType.TheStoryHub, options.stage);
      const cfClient = new CloudFormationClient({ region });

      try {
        logger.info(`Checking if stack ${stackName} exists...`);
        await cfClient.send(
          new DescribeStacksCommand({ StackName: stackName }),
        );

        logger.info(`Stack found. Preparing for deletion...`);

        // Delete S3 buckets first (they must be empty before stack deletion)
        logger.info("Deleting S3 buckets that prevent stack deletion...");
        const bucketNames = [
          `nlmonorepo-thestoryhub-frontend-${options.stage}`,
          `nlmonorepo-thestoryhub-userfiles-${options.stage}`,
          `nlmonorepo-thestoryhub-templates-${options.stage}`,
        ];

        for (const bucketName of bucketNames) {
          await emptyAndDeleteBucket(bucketName, region);
        }

        logger.info(`Deleting CloudFormation stack ${stackName}...`);
        await cfClient.send(new DeleteStackCommand({ StackName: stackName }));

        logger.info("Waiting for stack deletion to complete...");
        await waitUntilStackDeleteComplete(
          { client: cfClient, maxWaitTime: 1800 },
          { StackName: stackName },
        );

        logger.success(`✓ Stack ${stackName} deleted successfully`);
      } catch (error: any) {
        // Stack might not exist, which is fine
        if (
          error.name === "ResourceNotFoundException" ||
          error.message?.includes("does not exist")
        ) {
          logger.info(`Stack ${stackName} does not exist, skipping deletion`);
        } else {
          logger.warning(
            `Note: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    // Check and deploy dependencies
    logger.info("🔍 Checking dependencies...");
    const outputsManager = new OutputsManager();
    const dependencyChain = getDependencyChain(StackType.TheStoryHub);

    const missingDeps: StackType[] = [];

    for (const depStack of dependencyChain) {
      // Skip TheStoryHub itself
      if (depStack === StackType.TheStoryHub) continue;

      const depExists = await outputsManager.validateStackExists(
        depStack,
        options.stage,
      );

      if (!depExists) {
        missingDeps.push(depStack);
      }
    }

    if (missingDeps.length > 0) {
      logger.info(
        `📦 Missing dependencies detected: ${missingDeps.join(", ")}`,
      );
      logger.info("🚀 Auto-deploying dependencies...");

      const deploymentManager = new DeploymentManager();

      for (const depStack of missingDeps) {
        logger.info(`\n📦 Deploying ${depStack}...`);
        await deploymentManager.deployStack(depStack, deploymentOptions);
        logger.success(`✓ ${depStack} deployed successfully\n`);
      }
    } else {
      logger.success("✓ All dependencies are already deployed");
    }

    // Deploy The Story Hub
    logger.info("\n🏗️  Deploying The Story Hub...");
    await deployTheStoryHub(deploymentOptions);

    logger.success("\n✅ Deployment completed successfully!");
    logger.info("");
    logger.info(`📋 View deployment logs: ${logFilePath}`);
  } catch (error) {
    logger.error("❌ Deployment failed:");
    logger.error(error instanceof Error ? error.message : String(error));
    if (options.debug && error instanceof Error && error.stack) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
