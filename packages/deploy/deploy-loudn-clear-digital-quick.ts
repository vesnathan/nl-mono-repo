#!/usr/bin/env ts-node
/**
 * Loud'n'Clear Digital Quick Deploy Script
 *
 * Non-interactive deployment script with pre-configured settings for Loud'n'Clear Digital dev environment.
 *
 * Usage:
 *   yarn deploy:loudn-clear-digital:dev
 *
 * Or for update strategy:
 *   yarn deploy:loudn-clear-digital:dev:update
 *
 * Or for production:
 *   yarn deploy:loudn-clear-digital:dev --stage prod
 */

import { config } from "dotenv";
import * as path from "path";
import { deployLoudnClearDigital } from "./packages/loudn-clear-digital/deploy";
import { DeploymentOptions, StackType, getStackName } from "./types";
import { logger, setDebugMode, setLogFile } from "./utils/logger";
import { getAwsCredentials } from "./utils/aws-credentials";
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
  strategy: "update" | "replace";
  disableRollback: boolean;
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
    .option("strategy", {
      type: "string",
      description: "Deployment strategy",
      choices: ["update", "replace"] as const,
      default: "replace" as const,
    })
    .option("disable-rollback", {
      type: "boolean",
      description: "Disable automatic rollback on failure",
      default: true,
    })
    .option("debug", {
      alias: "d",
      type: "boolean",
      description: "Enable debug logging",
      default: false,
    })
    .help()
    .alias("help", "h")
    .parse();

  const options = argv as unknown as CliOptions;

  // Set up logging
  if (options.debug) {
    setDebugMode(true);
  }

  const logDir = path.resolve(__dirname, "../../logs");
  const logFile = path.join(
    logDir,
    `loudn-clear-digital-deploy-${options.stage}-${new Date().toISOString().replace(/[:.]/g, "-")}.log`,
  );
  setLogFile(logFile);

  logger.info("=".repeat(80));
  logger.info("Loud'n'Clear Digital Quick Deployment");
  logger.info("=".repeat(80));
  logger.info(`Stage: ${options.stage}`);
  logger.info(`Strategy: ${options.strategy}`);
  logger.info(`Region: ap-southeast-2`);
  logger.info(`Disable Rollback: ${options.disableRollback}`);
  logger.info("=".repeat(80));

  const region = "ap-southeast-2";
  const stackName = getStackName(StackType.LoudnClearDigital, options.stage);

  try {
    // Validate AWS credentials
    logger.info("\nValidating AWS credentials...");
    await getAwsCredentials();

    // Handle replace strategy
    if (options.strategy === "replace") {
      logger.info("\nUsing REPLACE strategy - will delete and recreate stack");

      const cfnClient = new CloudFormationClient({ region });

      // Check if stack exists
      let stackExists = false;
      try {
        await cfnClient.send(
          new DescribeStacksCommand({ StackName: stackName }),
        );
        stackExists = true;
      } catch (error: any) {
        if (!error.message.includes("does not exist")) {
          throw error;
        }
      }

      if (stackExists) {
        logger.info(`\nDeleting existing stack: ${stackName}`);

        // Empty and delete S3 buckets first
        const buckets = [
          `nlmonorepo-lawnorder-templates-${options.stage}`,
          `nlmonorepo-lawnorder-website-${options.stage}`,
        ];

        logger.info("\nEmptying S3 buckets before stack deletion...");
        for (const bucket of buckets) {
          await emptyAndDeleteBucket(bucket, region);
        }

        // Delete the stack
        await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
        logger.info("Waiting for stack deletion to complete...");
        await waitUntilStackDeleteComplete(
          { client: cfnClient, maxWaitTime: 600 },
          { StackName: stackName },
        );
        logger.success("✓ Stack deleted successfully");
      } else {
        logger.info("Stack does not exist, will create new stack");
      }
    }

    // Deploy the stack
    const deployOptions: DeploymentOptions = {
      stage: options.stage,
      region,
      disableRollback: options.disableRollback,
    };

    logger.info("\nStarting deployment...");
    await deployLoudnClearDigital(deployOptions);

    logger.success("\n" + "=".repeat(80));
    logger.success("Deployment completed successfully!");
    logger.success("=".repeat(80));
    logger.info(`Log file: ${logFile}`);
  } catch (error: any) {
    logger.error("\n" + "=".repeat(80));
    logger.error("Deployment failed!");
    logger.error("=".repeat(80));
    logger.error(error.message);
    if (error.stack) {
      logger.debug(error.stack);
    }
    logger.info(`Log file: ${logFile}`);
    process.exit(1);
  }
}

main();
