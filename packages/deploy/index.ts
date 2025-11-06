#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { config } from "dotenv";
import {
  logger,
  setDebugMode as setLoggerDebugMode,
  resetDebugMode,
  setLogFile,
} from "./utils/logger"; // Import resetDebugMode
import { getAwsCredentials } from "./utils/aws-credentials";
import {
  DeploymentOptions,
  StackType,
  ForceDeleteOptions,
} from "./types";
import { DeploymentManager } from "./deployment-manager";
import { OutputsManager } from "./outputs-manager";
import { candidateExportNames } from "./utils/export-names";
import { getProjectConfig } from "./project-config";
import { seedDB } from "./utils/seed-db";
import { REGEX } from "../shared/constants/RegEx"; // Corrected import
import path from "path"; // Import path
import { rm } from "fs/promises";
import {
  S3Client,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
  DeleteBucketCommand,
} from "@aws-sdk/client-s3";

// Load environment variables from mono-repo root
config({ path: path.resolve(__dirname, "../../.env") });

const program = new Command();

// Helper function for prompting admin email
async function promptForAdminEmail(): Promise<string> {
  const { adminEmail } = await inquirer.prompt([
    {
      type: "input",
      name: "adminEmail",
      message: "Enter admin email address for user creation:",
      default: "admin@example.com",
      validate: (input: string) =>
        REGEX.EMAIL.test(input.trim()) ||
        "Please enter a valid email address.",
    },
  ]);
  return adminEmail.trim();
}

/**
 * Empty and delete an S3 bucket (including all versions and delete markers)
 */
async function emptyAndDeleteBucket(
  bucketName: string,
  region: string,
): Promise<void> {
  const s3Client = new S3Client({ region });

  try {
    logger.info(`  Emptying S3 bucket: ${bucketName}`);

    // List and delete all object versions and delete markers
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

/**
 * Get all bucket names for a given stack and stage
 */
function getBucketNamesForStack(stack: StackType, stage: string): string[] {
  const buckets: string[] = [];

  switch (stack) {
    case StackType.TheStoryHub:
      buckets.push(
        `nlmonorepo-thestoryhub-frontend-${stage}`,
        `nlmonorepo-thestoryhub-userfiles-${stage}`,
        `nlmonorepo-thestoryhub-templates-${stage}`,
      );
      break;
    // Add other stacks here as needed
    default:
      break;
  }

  return buckets;
}

// --- Commander Program Setup ---
async function main() {
  // FIRST: Clear entire .cache directory before anything else
  const cacheDir = path.join(__dirname, "../..", ".cache", "deploy");
  try {
    await rm(cacheDir, { recursive: true, force: true });
    console.log(`🧹 Cleared cache directory: ${cacheDir}`);
  } catch (error: any) {
    // If cache doesn't exist, that's fine
    console.log(
      `Cache directory didn't exist or couldn't be cleared: ${error.message}`,
    );
  }

  // Ensure debug mode is completely reset at startup
  resetDebugMode();

  const deploymentManager = new DeploymentManager();
  await deploymentManager.initializeAws();

  program.version("1.0.0").description("CloudWatchLive Deployment Tool");

  program
    .command("deploy")
    .description("Deploy, manage, or remove stacks interactively")
    .action(async () => {
      try {
        // Reset debug mode at the start
        setLoggerDebugMode(false);

        const { stage } = await inquirer.prompt([
          {
            type: "input",
            name: "stage",
            message: "Enter the deployment stage (e.g., dev, prod):",
            default: "dev",
            validate: (input) =>
              REGEX.ALPHA_NUMERIC.test(input)
                ? true
                : "Stage must be alphanumeric.",
          },
        ]);

        const { debug } = await inquirer.prompt([
          {
            type: "confirm",
            name: "debug",
            message: "Run in debug mode for detailed logging?",
            default: false,
          },
        ]);

        if (debug) {
          setLoggerDebugMode(true);
        }

        const deployMenu = async () => {
          logger.menu("\n" + "=".repeat(40));
          logger.menu("Deploy/Update Stacks");
          logger.menu("=".repeat(40));

          // Build dynamic stack choices from project config
          const stackChoices = [
            {
              name: "All (recommended for first-time setup)",
              value: "all",
            },
            ...Object.values(StackType).map((stackType) => ({
              name: getProjectConfig(stackType).displayName,
              value: stackType,
            })),
            new inquirer.Separator(),
            { name: "<- Go Back", value: "back" },
          ];

          const { stack } = await inquirer.prompt([
            {
              type: "list",
              name: "stack",
              message: "Which stack do you want to deploy/update?",
              choices: stackChoices,
            },
          ]);

          if (stack === "back") {
            return;
          }

          // Set up logging for this deployment operation
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const stackTypeStr =
            stack === "all"
              ? "all-stacks"
              : getProjectConfig(stack as StackType).packageDir ||
                (stack as string).toLowerCase();
          const logFilePath = path.join(
            __dirname,
            "../..",
            ".cache",
            "deploy",
            stackTypeStr,
            "logs",
            `deployment-${timestamp}.log`,
          );
          setLogFile(logFilePath);
          logger.info(`📝 Deployment logs: ${logFilePath}`);

          const { deploymentType } = await inquirer.prompt([
            {
              type: "list",
              name: "deploymentType",
              message: "Choose a deployment strategy:",
              choices: [
                {
                  name: "Update (create if not exists, update if exists)",
                  value: "update",
                },
                {
                  name: "Force Replace (delete if exists, then create)",
                  value: "replace",
                },
              ],
            },
          ]);

          let adminEmail: string | undefined;
          if (
            stack === "all" ||
            stack === StackType.CWL ||
            stack === StackType.AwsExample ||
            stack === StackType.TheStoryHub
          ) {
            const { needsAdmin } = await inquirer.prompt([
              {
                type: "confirm",
                name: "needsAdmin",
                message: "Do you want to create/update the default admin user?",
                default: true,
              },
            ]);
            if (needsAdmin) {
              adminEmail = await promptForAdminEmail();
            }
          }

          // Ask about frontend build for stacks that have frontends
          let skipFrontendBuild = false;
          const stackConfig =
            stack !== "all" ? getProjectConfig(stack as StackType) : null;
          if (stack === "all" || stackConfig?.hasFrontend) {
            const { buildFrontend } = await inquirer.prompt([
              {
                type: "confirm",
                name: "buildFrontend",
                message:
                  "Build frontend application? (Required for frontend deployment, skip if having build issues)",
                default: false,
              },
            ]);
            skipFrontendBuild = !buildFrontend;
          }

          // Ask about rollback behavior for new stack creation
          const { disableRollback } = await inquirer.prompt([
            {
              type: "confirm",
              name: "disableRollback",
              message:
                "Disable automatic rollback on stack creation failure? (Useful for debugging deployment errors)",
              default: false,
            },
          ]);

          // WAF removed from deployment
          let skipWAF = true;

          // Ask about custom domain configuration for prod deployments of The Story Hub
          let domainName: string | undefined;
          let hostedZoneId: string | undefined;
          if (
            stage === "prod" &&
            (stack === StackType.TheStoryHub || stack === "all")
          ) {
            const { configureDomain } = await inquirer.prompt([
              {
                type: "confirm",
                name: "configureDomain",
                message:
                  "Configure custom domain for CloudFront? (Requires Route53 hosted zone)",
                default: false,
              },
            ]);

            if (configureDomain) {
              const domainAnswers = await inquirer.prompt([
                {
                  type: "input",
                  name: "domainName",
                  message: "Enter your custom domain name:",
                  default: "the-story-hub.com",
                  validate: (input: string) =>
                    input.trim().length > 0 || "Domain name cannot be empty",
                },
                {
                  type: "input",
                  name: "hostedZoneId",
                  message: "Enter your Route53 Hosted Zone ID:",
                  default: "Z02681573J5GWRCZ2PHRC",
                  validate: (input: string) =>
                    input.trim().length > 0 || "Hosted Zone ID cannot be empty",
                },
              ]);
              domainName = domainAnswers.domainName.trim();
              hostedZoneId = domainAnswers.hostedZoneId.trim();

              logger.info(`✓ Domain configuration:`);
              logger.info(`  - Domain: ${domainName}`);
              logger.info(`  - Hosted Zone: ${hostedZoneId}`);
            }
          }

          const options: DeploymentOptions = {
            stage,
            adminEmail,
            skipUserCreation: !adminEmail,
            autoDeleteFailedStacks: true,
            skipFrontendBuild,
            disableRollback,
            skipWAF,
            ...(domainName && { domainName }),
            ...(hostedZoneId && { hostedZoneId }),
          };

          const deployAction = async (stackToDeploy: StackType | "all") => {
            if (stackToDeploy === "all") {
              await deploymentManager.deploySequentially(options);
            } else {
              await deploymentManager.deployStack(stackToDeploy, options);
            }
          };

          if (deploymentType === "replace") {
            logger.info(`Strategy: Force Replace. Stack(s): ${stack}`);
            if (stack === "all") {
              await deploymentManager.removeAllStacks(options);
              await deployAction("all");
            } else {
              await deploymentManager.removeStack(stack, options);
              await deployAction(stack);
            }
          } else {
            // update
            logger.info(`Strategy: Update. Stack(s): ${stack}`);
            await deployAction(stack);
          }
        };

        const forceRemoveMenu = async () => {
          const { stackType } = await inquirer.prompt([
            {
              type: "list",
              name: "stackType",
              message: "Which stack type do you want to force delete?",
              choices: Object.values(StackType),
            },
          ]);
          const { region } = await inquirer.prompt([
            {
              type: "input",
              name: "region",
              message: `Enter the region for the ${stackType} stack (defaults to ap-southeast-2, but WAF is us-east-1):`,
              default:
                stackType === StackType.WAF ? "us-east-1" : "ap-southeast-2",
            },
          ]);
          const options: ForceDeleteOptions = {
            stackType,
            stage,
            region,
          };
          await deploymentManager.runForceDelete(options);
        };

        const removeMenu = async () => {
          logger.menu("\n" + "=".repeat(40));
          logger.menu("Remove Stacks");
          logger.menu("=".repeat(40));

          // Build dynamic stack choices from project config
          const stackTypeChoices = [
            { name: "All", value: "all" },
            ...Object.values(StackType).map((stackType) => ({
              name: getProjectConfig(stackType).displayName,
              value: stackType,
            })),
          ];

          const { stack } = await inquirer.prompt([
            {
              type: "list",
              name: "stack",
              message: "Which stack do you want to remove?",
              choices: [
                ...stackTypeChoices,
                new inquirer.Separator(),
                { name: "A specific resource (force delete)", value: "force" },
                { name: "<- Go Back", value: "back" },
              ],
            },
          ]);

          if (stack === "back") {
            return;
          }

          if (stack === "force") {
            await forceRemoveMenu();
            return;
          }

          // Add confirmation prompt for destructive operations
          const stackName = stack === "all" ? "ALL stacks" : `${stack} stack`;
          const { confirmed } = await inquirer.prompt([
            {
              type: "confirm",
              name: "confirmed",
              message: `⚠️  Are you sure you want to remove ${stackName} for stage '${stage}'? This action cannot be undone.`,
              default: false,
            },
          ]);

          if (!confirmed) {
            logger.warning("Stack removal cancelled by user.");
            return;
          }

          const options: DeploymentOptions = { stage };
          const region = process.env.AWS_REGION || "ap-southeast-2";

          // Delete S3 buckets BEFORE stack deletion
          if (stack === "all") {
            logger.info("Deleting S3 buckets for all stacks...");
            // For "all" stacks, delete buckets for each stack type
            for (const stackType of Object.values(StackType)) {
              const buckets = getBucketNamesForStack(stackType, stage);
              for (const bucketName of buckets) {
                await emptyAndDeleteBucket(bucketName, region);
              }
            }
          } else {
            logger.info(`Deleting S3 buckets for ${stack} stack...`);
            const buckets = getBucketNamesForStack(stack as StackType, stage);
            for (const bucketName of buckets) {
              await emptyAndDeleteBucket(bucketName, region);
            }
          }

          // Now remove the CloudFormation stacks
          if (stack === "all") {
            logger.info(
              `Starting removal of all stacks. This may take several minutes...`,
            );
            await deploymentManager.removeAllStacks(options);
          } else {
            logger.info(`Starting removal of ${stack} stack...`);
            await deploymentManager.removeStack(stack, options);
          }
        };

        const reseedMenu = async () => {
          logger.menu("\n" + "=".repeat(40));
          logger.menu("Reseed Database");
          logger.menu("=".repeat(40));

          const { appName } = await inquirer.prompt([
            {
              type: "list",
              name: "appName",
              message: "Select application to reseed:",
              choices: [
                { name: "The Story Hub", value: "the-story-hub" },
                { name: "CloudWatch Live", value: "cloudwatchlive" },
                new inquirer.Separator(),
                { name: "<- Go Back", value: "back" },
              ],
            },
          ]);

          if (appName === "back") {
            return;
          }

          const region = process.env.AWS_REGION || "ap-southeast-2";

          logger.info(`🌱 Reseeding ${appName} database for stage: ${stage}`);

          // Get table name
          const outputsManager = new OutputsManager();
          let stackType: StackType;

          if (appName === "the-story-hub") {
            stackType = StackType.TheStoryHub;
          } else if (appName === "cloudwatchlive") {
            stackType = StackType.CWL;
          } else {
            throw new Error(`Unknown app: ${appName}`);
          }

          const candidates = candidateExportNames(
            stackType,
            stage,
            "DataTableName",
          );

          let tableName =
            (await outputsManager.findOutputValueByCandidates(
              stage,
              candidates,
            )) ||
            (await outputsManager.getOutputValue(
              stackType,
              stage,
              "DataTableName",
            ));

          if (!tableName) {
            // Fallback to default naming
            const appNameForTable = appName.replace(/-/g, "");
            tableName = `nlmonorepo-${appNameForTable}-datatable-${stage}`;
            logger.warning(
              `Could not find table name in outputs, using fallback: ${tableName}`,
            );
          }

          logger.info(`📊 Target table: ${tableName}`);

          // Run seeding with --force flag to clear existing data first
          await seedDB({
            region,
            tableName,
            stage,
            appName,
            skipConfirmation: false, // Require confirmation for manual reseed
            extraArgs: ["--force"], // Clear table before reseeding
          });

          logger.success(`✅ Successfully reseeded ${appName} database`);
        };

        const mainMenu = async () => {
          let continueMenu = true;

          while (continueMenu) {
            logger.menu("\n" + "=".repeat(50));
            logger.menu("Deployment Tool - Main Menu");
            logger.menu("=".repeat(50));

            const { action } = await inquirer.prompt([
              {
                type: "list",
                name: "action",
                message: "What would you like to do?",
                choices: [
                  { name: "Deploy or Update Stacks", value: "deploy" },
                  { name: "Remove Stacks", value: "remove" },
                  { name: "Reseed Database", value: "reseed" },
                  new inquirer.Separator(),
                  { name: "Exit", value: "exit" },
                ],
              },
            ]);

            switch (action) {
              case "deploy":
                await deployMenu();
                logger.menu("\n" + "-".repeat(30));
                logger.menu("Returning to main menu...");
                logger.menu("-".repeat(30));
                break;
              case "remove":
                await removeMenu();
                logger.menu("\n" + "-".repeat(30));
                logger.menu("Returning to main menu...");
                logger.menu("-".repeat(30));
                break;
              case "reseed":
                await reseedMenu();
                logger.menu("\n" + "-".repeat(30));
                logger.menu("Returning to main menu...");
                logger.menu("-".repeat(30));
                break;
              case "exit":
                logger.info("Exiting deployment tool.");
                continueMenu = false;
                process.exit(0);
            }
          }
        };

        await mainMenu();
      } catch (error: unknown) {
        logger.error(
          `An unexpected error occurred: ${(error as Error).message}`,
        );
        process.exit(1);
      }
    });

  program
    .command("reseed")
    .description("Reseed the database for a specific package")
    .option("-a, --app <app>", "Application name (e.g., the-story-hub)")
    .option("-s, --stage <stage>", "Stage (e.g., dev, prod)")
    .option("-r, --region <region>", "AWS region")
    .action(async (cmdOptions) => {
      try {
        const { app, stage: cmdStage, region: cmdRegion } = cmdOptions;

        // Get stage and region
        const stage = cmdStage || process.env.STAGE || "dev";
        const region = cmdRegion || process.env.AWS_REGION || "ap-southeast-2";

        // Prompt for app if not provided
        let appName = app;
        if (!appName) {
          const answers = await inquirer.prompt([
            {
              type: "list",
              name: "appName",
              message: "Select application to reseed:",
              choices: [
                { name: "The Story Hub", value: "the-story-hub" },
                { name: "CloudWatch Live", value: "cloudwatchlive" },
              ],
            },
          ]);
          appName = answers.appName;
        }

        logger.info(`🌱 Reseeding ${appName} database for stage: ${stage}`);

        // Get table name
        const outputsManager = new OutputsManager();
        let stackType: StackType;

        if (appName === "the-story-hub") {
          stackType = StackType.TheStoryHub;
        } else if (appName === "cloudwatchlive") {
          stackType = StackType.CWL;
        } else {
          throw new Error(`Unknown app: ${appName}`);
        }

        const candidates = candidateExportNames(
          stackType,
          stage,
          "DataTableName",
        );

        let tableName =
          (await outputsManager.findOutputValueByCandidates(
            stage,
            candidates,
          )) ||
          (await outputsManager.getOutputValue(
            stackType,
            stage,
            "DataTableName",
          ));

        if (!tableName) {
          // Fallback to default naming
          const appNameForTable = appName.replace(/-/g, "");
          tableName = `nlmonorepo-${appNameForTable}-datatable-${stage}`;
          logger.warning(
            `Could not find table name in outputs, using fallback: ${tableName}`,
          );
        }

        logger.info(`📊 Target table: ${tableName}`);

        // Run seeding
        await seedDB({
          region,
          tableName,
          stage,
          appName,
          skipConfirmation: false, // Require confirmation for manual reseed
        });

        logger.success(`✅ Successfully reseeded ${appName} database`);
      } catch (error: unknown) {
        logger.error(`Reseed failed: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  logger.error("Deployment script failed.");
  logger.error(err);
  process.exit(1);
});
