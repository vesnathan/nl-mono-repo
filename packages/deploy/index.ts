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
import { AwsUtils } from "./utils/aws-utils";
import { FrontendDeploymentManager } from "./utils/frontend-deployment";
import { UserSetupManager } from "./utils/user-setup";
import { getAwsCredentials } from "./utils/aws-credentials";
import {
  DeploymentOptions,
  StackType,
  getStackName,
  getTemplateBucketName,
  getTemplateBody,
  ForceDeleteOptions,
} from "./types";
import { getDeployHandler } from "./deploy-registry";
import { ForceDeleteManager } from "./utils/force-delete-utils";
import { OutputsManager } from "./outputs-manager";
import { candidateExportNames } from "./utils/export-names";
import {
  DependencyValidator,
  getDependencyChain,
} from "./dependency-validator";
import { getProjectConfig } from "./project-config";
import { seedDB } from "./utils/seed-db";
import {
  CloudFormationClient,
  CreateStackCommand,
  UpdateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
  StackStatus,
  Parameter,
  Stack,
  Tag,
  Capability,
} from "@aws-sdk/client-cloudformation";
import { S3Client } from "@aws-sdk/client-s3";
import { REGEX } from "../shared/constants/RegEx"; // Corrected import
import { execSync } from "child_process"; // Import execSync
import path from "path"; // Import path
import { readdirSync } from "fs";
import { rm } from "fs/promises";

// Load environment variables from mono-repo root
config({ path: path.resolve(__dirname, "../../.env") });

const program = new Command();

class DeploymentManager {
  private awsUtils!: AwsUtils;
  public cfClient: CloudFormationClient; // Made public for easier access in WAF deployment
  private frontendManager: FrontendDeploymentManager;
  private userManager: UserSetupManager;
  private outputsManager: OutputsManager;
  private dependencyValidator: DependencyValidator;
  private region: string;
  public forceDeleteManager: ForceDeleteManager; // Made public

  constructor(region = "ap-southeast-2") {
    // Ensure debug mode is disabled by default
    setLoggerDebugMode(false);

    this.region = region;
    this.cfClient = new CloudFormationClient({ region });
    this.frontendManager = new FrontendDeploymentManager(region);
    this.userManager = new UserSetupManager(region);
    this.outputsManager = new OutputsManager();
    this.dependencyValidator = new DependencyValidator();
    // Initialize ForceDeleteManager with the base region. Regional instances will be created as needed.
    this.forceDeleteManager = new ForceDeleteManager(this.region);
  }

  async runForceDelete(options: ForceDeleteOptions): Promise<void> {
    const { stackType, stage, region } = options;

    // Set up logging for force delete operations
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const stackTypeStr =
      getProjectConfig(stackType).packageDir || stackType.toLowerCase();
    const logFilePath = path.join(
      __dirname,
      "../..",
      ".cache",
      "deploy",
      stackTypeStr,
      "logs",
      `force-delete-${timestamp}.log`,
    );
    setLogFile(logFilePath);
    logger.info(`📝 Force delete logs: ${logFilePath}`);

    // WAF is always in us-east-1
    const effectiveRegion =
      stackType === StackType.WAF ? "us-east-1" : region || this.region;
    const forceDeleteManager =
      effectiveRegion === this.region
        ? this.forceDeleteManager
        : new ForceDeleteManager(effectiveRegion);
    const fullStackName = getStackName(stackType, stage);
    const stackIdentifier = `nlmonorepo-${stackType.toLowerCase()}`;

    logger.info(
      `Starting force delete for stack ${fullStackName} in region ${effectiveRegion}`,
    );
    // forceDeleteStack expects a base identifier (e.g., nlmonorepo-cwl) so pass stackIdentifier
    await forceDeleteManager.forceDeleteStack(
      stackIdentifier,
      stackType,
      stage,
    );
    logger.success(
      `Force delete process completed for stack ${fullStackName}.`,
    );
  }

  async removeStack(
    stackType: StackType,
    options: DeploymentOptions,
  ): Promise<void> {
    const { stage } = options;
    const stackName = getStackName(stackType, stage);
    const region =
      stackType === StackType.WAF ? "us-east-1" : options.region || this.region;

    logger.info(`🗑️  Removing ${stackType} stack: ${stackName}`);
    logger.info(`📍 Region: ${region}`);

    try {
      // Create region-specific CloudFormation client
      const regionClient =
        region === this.region
          ? this.cfClient
          : new CloudFormationClient({ region });

      logger.info(`Checking if stack exists...`);
      const exists = await this.stackExists(stackName, regionClient);

      if (exists) {
        logger.info(`Stack found. Starting deletion process...`);

        // Use ForceDeleteManager to properly handle S3 bucket cleanup
        const forceDeleteManager = new ForceDeleteManager(region, stage);
        // Use the base identifier format: nlmonorepo-{stacktype}
        const stackIdentifier = `nlmonorepo-${stackType.toLowerCase()}`;

        logger.info(`Cleaning up S3 buckets and other resources...`);
        await forceDeleteManager.forceDeleteStack(
          stackIdentifier,
          stackType,
          stage,
        );

        logger.success(`✓ Stack ${stackName} deleted successfully.`);

        logger.info(`Removing stack outputs from deployment-outputs.json...`);
        await this.outputsManager.removeStackOutputs(stackType, stage);
        logger.info(`✓ Stack outputs removed from deployment-outputs.json`);
        // As a best-effort final cleanup step, attempt to delete any conventionally
        // named buckets that may remain (template buckets, frontend buckets, etc.).
        try {
          logger.info(
            `Attempting final conventional bucket deletion for ${stackName}...`,
          );
          await forceDeleteManager.deleteConventionalBuckets(
            stackIdentifier,
            stackType,
            stage,
          );
        } catch (bucketErr: any) {
          logger.warning(
            `Final conventional bucket deletion for ${stackName} failed (continuing): ${bucketErr.message || bucketErr}`,
          );
        }
      } else {
        logger.warning(
          `Stack ${stackName} does not exist in ${region}. Nothing to remove.`,
        );

        // Even if stack doesn't exist, try to clean up any orphaned buckets
        logger.info(`Checking for orphaned S3 buckets...`);
        const forceDeleteManager = new ForceDeleteManager(region, stage);
        const stackIdentifier = `nlmonorepo-${stackType.toLowerCase()}`;
        // If the stack doesn't exist, still attempt to delete conventional buckets
        // (this handles cases where the CFN stack was removed but buckets remained).
        try {
          await forceDeleteManager.deleteConventionalBuckets(
            stackIdentifier,
            stackType,
            stage,
          );
        } catch (bucketErr: any) {
          logger.warning(
            `Conventional bucket deletion for orphaned stack ${stackName} failed: ${bucketErr.message || bucketErr}`,
          );
        }
      }
    } catch (error: unknown) {
      logger.error(
        `✗ Failed to remove stack ${stackName}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async waitForStackDeletion(
    stackName: string,
    client: CloudFormationClient,
  ): Promise<void> {
    logger.info(`Waiting for stack ${stackName} deletion to complete...`);
    const command = new DescribeStacksCommand({ StackName: stackName });

    const checkStatus = async (): Promise<void> => {
      try {
        await client.send(command);
        // If describe succeeds, stack still exists. Wait and try again.
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10-second wait
        return checkStatus();
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name: string }).name === "ValidationError"
        ) {
          // This error is expected when the stack is finally deleted.
          logger.success(`Stack ${stackName} has been successfully deleted.`);
          return;
        }
        // Re-throw other errors
        throw error;
      }
    };

    await checkStatus();
  }

  async deploySequentially(options: DeploymentOptions): Promise<void> {
    // Ensure debug mode is properly set
    setLoggerDebugMode(options.debugMode || false);

    // Get deployment order dynamically based on dependencies
    const deploymentOrder = this.dependencyValidator.getDeploymentOrder();

    logger.info(
      `Deploying all stacks in dependency order: ${deploymentOrder.join(" -> ")}`,
    );

    for (const stackType of deploymentOrder) {
      logger.info(`\n🚀 Deploying ${stackType} stack...`);
      await this.deployStack(stackType, options);

      // Reload outputs after each stack deployment to make them available to next stack
      this.outputsManager = new OutputsManager();
      logger.success(`✓ ${stackType} stack deployed successfully\n`);
    }

    logger.success("🎉 All stacks deployed successfully!");
  }

  public getRegion(): string {
    return this.region;
  }

  async initializeAws(): Promise<void> {
    try {
      const credentials = await getAwsCredentials();
      this.awsUtils = new AwsUtils(this.region, credentials);
      logger.debug("AWS credentials initialized");
    } catch (error: unknown) {
      logger.error(
        `Failed to initialize AWS credentials: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private async checkAndCleanupFailedStack(
    stackType: StackType,
    options: DeploymentOptions,
  ): Promise<void> {
    const stackName = getStackName(stackType, options.stage);
    const region =
      stackType === StackType.WAF ? "us-east-1" : options.region || this.region;
    const client =
      region !== this.region
        ? new CloudFormationClient({
            region,
            credentials: this.cfClient.config.credentials,
          })
        : this.cfClient;

    try {
      const describeCommand = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await client.send(describeCommand);
      const stack = response.Stacks?.[0];
      if (
        stack &&
        (stack.StackStatus === StackStatus.CREATE_FAILED ||
          stack.StackStatus === StackStatus.ROLLBACK_COMPLETE ||
          stack.StackStatus === StackStatus.ROLLBACK_FAILED)
      ) {
        logger.warning(
          `Stack ${stackName} is in a failed state (${stack.StackStatus}). Attempting to delete it.`,
        );
        await this.removeStack(stackType, options);
      }
    } catch (error: unknown) {
      // Type guard for error name and message (assuming error is an object with name and message properties)
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        "message" in error &&
        (error as { name: string }).name === "ValidationError" &&
        (error as { message: string }).message.includes("does not exist")
      ) {
        // Stack doesn\'t exist, nothing to clean up
      } else {
        logger.error(
          `Error checking status of stack ${stackName} for cleanup: ${(error as Error).message}`,
        );
      }
    }
  }

  async deployStack(
    stackType: StackType,
    options: DeploymentOptions,
  ): Promise<void> {
    const { stage } = options;
    const effectiveRegion =
      stackType === StackType.WAF ? "us-east-1" : options.region || this.region;

    const deploymentOptionsWithRegion: DeploymentOptions = {
      ...options,
      region: effectiveRegion,
    };

    try {
      // Check if dependencies are satisfied
      const dependenciesValid =
        await this.dependencyValidator.validateDependencies(
          stackType,
          stage,
          options.skipWAF || false,
        );

      if (!dependenciesValid) {
        // Get the full dependency chain for this stack
        const dependencyChain = getDependencyChain(stackType);

        // Filter out WAF if skipWAF is enabled
        const filteredChain = options.skipWAF
          ? dependencyChain.filter((s) => s !== StackType.WAF)
          : dependencyChain;

        logger.info(
          `Auto-deploying missing dependencies for ${stackType}: ${filteredChain.filter((s) => s !== stackType).join(", ")}`,
        );

        // Deploy each dependency that's not already deployed
        for (const depStack of filteredChain) {
          // Skip the target stack itself
          if (depStack === stackType) continue;

          // Check if this dependency is already deployed
          const depExists = await this.outputsManager.validateStackExists(
            depStack,
            stage,
          );

          if (!depExists) {
            logger.info(`Deploying missing dependency: ${depStack}`);
            await this.deployStack(depStack, deploymentOptionsWithRegion);
            // Reload outputs after each dependency deployment
            this.outputsManager = new OutputsManager();
          } else {
            logger.debug(`Dependency ${depStack} is already deployed`);
          }
        }
      }

      if (deploymentOptionsWithRegion.autoDeleteFailedStacks) {
        await this.checkAndCleanupFailedStack(
          stackType,
          deploymentOptionsWithRegion,
        );
      }

      // WAF stack is deployed in us-east-1. Other stacks use the region from options or the default.
      if (stackType === StackType.WAF) {
        const wafDeployer =
          effectiveRegion === this.region
            ? this
            : new DeploymentManager("us-east-1");
        if (effectiveRegion !== this.region) await wafDeployer.initializeAws(); // Initialize if new instance
        await wafDeployer.deployStackInternal(
          stackType,
          deploymentOptionsWithRegion,
        );
      } else {
        // Use the deploy registry to get the appropriate handler
        const deployHandler = getDeployHandler(stackType);
        await deployHandler(deploymentOptionsWithRegion);
      }

      await this.outputsManager.saveStackOutputs(
        stackType,
        stage,
        effectiveRegion,
      );
      logger.success(`Successfully deployed ${stackType} stack`);
      await this.postDeploymentTasks(stackType, deploymentOptionsWithRegion);
    } catch (error: unknown) {
      logger.error(
        `Failed to deploy ${stackType} stack: ${(error as Error).message}`,
      );
      if (options.autoDeleteFailedStacks) {
        const stackName = getStackName(stackType, options.stage);
        await this.handleFailedStack(stackName, effectiveRegion);
      }
      throw error;
    }
  }

  public async deployStackInternal(
    stackType: StackType,
    options: DeploymentOptions,
  ): Promise<void> {
    const { stage, region, roleArn, tags: tagsObject } = options; // Destructure roleArn and tags
    const stackName = getStackName(stackType, stage);
    const templateBody = await getTemplateBody(stackType);
    const parameters = await this.getStackParameters(stackType, stage, options);

    // Convert tags object to Tag[] format
    const tags: Tag[] | undefined = tagsObject
      ? Object.entries(tagsObject).map(([Key, Value]) => ({ Key, Value }))
      : undefined;

    const client =
      region === this.region
        ? this.cfClient
        : new CloudFormationClient({
            region,
            credentials: this.cfClient.config.credentials,
          });

    if (stackType === StackType.WAF) {
      logger.debug("🚀 WAF deployment started...");
    }
    logger.debug(`Deploying stack ${stackName} in region ${region}`);

    if (await this.stackExists(stackName, client)) {
      logger.debug(`Stack ${stackName} already exists, updating...`);
      // Correctly pass undefined for roleArn and tags if they are not provided
      await this.updateStack(
        stackName,
        templateBody,
        parameters,
        roleArn,
        tags,
        client,
      );
    } else {
      logger.debug(`Stack ${stackName} does not exist, creating...`);
      // Correctly pass undefined for roleArn and tags if they are not provided
      await this.createStack(
        stackName,
        templateBody,
        parameters,
        roleArn,
        tags,
        client,
      );
    }
    await this.waitForStackCompletion(stackName, client);
  }

  private async handleFailedStack(
    stackName: string,
    region?: string,
  ): Promise<void> {
    logger.warning(
      `Stack ${stackName} failed. Attempting to gather failure details.`,
    );
    try {
      // Corrected: awsUtils.getStackFailureDetails expects stackName and region string
      const effectiveRegion =
        region || ((await this.cfClient.config.region()) as string);
      await this.awsUtils.getStackFailureDetails(stackName, effectiveRegion);
      logger.info(
        `Further cleanup or deletion for ${stackName} might be required.`,
      );
    } catch (error: unknown) {
      logger.error(
        `Could not retrieve failure details for stack ${stackName}: ${(error as Error).message}`,
      );
    }
  }

  public async stackExists(
    stackName: string,
    client?: CloudFormationClient,
  ): Promise<boolean> {
    const cfClient = client || this.cfClient;
    try {
      const command = new DescribeStacksCommand({ StackName: stackName });
      await cfClient.send(command);
      return true;
    } catch (error: unknown) {
      // Type guard for error name and message (assuming error is an object with name and message properties)
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        "message" in error &&
        (error as { name: string }).name === "ValidationError" &&
        (error as { message: string }).message.includes("does not exist")
      ) {
        return false;
      }
      // Corrected: logger.warn to logger.warning
      logger.warning(
        `Error checking if stack ${stackName} exists: ${(error as Error).message}`,
      );
      return false; // Assume not exists or inaccessible on other errors
    }
  }

  public async createStack(
    stackName: string,
    templateBody: string,
    parameters: Parameter[],
    roleArn?: string,
    tags?: Tag[],
    client?: CloudFormationClient,
  ): Promise<void> {
    const cfClient = client || this.cfClient;
    const command = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: parameters,
      Capabilities: [
        "CAPABILITY_IAM",
        "CAPABILITY_NAMED_IAM",
        "CAPABILITY_AUTO_EXPAND",
      ],
      EnableTerminationProtection: false,
      RoleARN: roleArn,
      Tags: tags,
    });
    await cfClient.send(command);
  }

  public async updateStack(
    stackName: string,
    templateBody: string,
    parameters: Parameter[],
    roleArn?: string,
    tags?: Tag[],
    client?: CloudFormationClient,
  ): Promise<void> {
    const cfClient = client || this.cfClient;
    try {
      const command = new UpdateStackCommand({
        StackName: stackName,
        TemplateBody: templateBody,
        Parameters: parameters,
        Capabilities: [
          "CAPABILITY_IAM",
          "CAPABILITY_NAMED_IAM",
          "CAPABILITY_AUTO_EXPAND",
        ],
        RoleARN: roleArn,
        Tags: tags,
      });
      await cfClient.send(command);
    } catch (error: unknown) {
      if (
        (error as Error).message?.includes("No updates are to be performed")
      ) {
        logger.debug(`Stack ${stackName} is already up to date`);
        return;
      }
      throw error;
    }
  }

  public async waitForStackCompletion(
    stackName: string,
    client?: CloudFormationClient,
  ): Promise<void> {
    const cfClient = client || this.cfClient;
    const maxWaitTime = 30 * 60 * 1000;
    const pollInterval = 30 * 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await cfClient.send(command);
        const stack = response.Stacks?.[0];

        if (!stack) {
          throw new Error(`Stack ${stackName} not found during wait`);
        }

        const status = stack.StackStatus as StackStatus;
        logger.debug(`Stack ${stackName} status: ${status}`);

        if (this.isFinalStatus(status)) {
          if (status.endsWith("_COMPLETE")) {
            logger.debug(
              `Stack ${stackName} operation completed with status: ${status}`,
            );
            return;
          } else if (
            status.endsWith("_FAILED") ||
            status.includes("ROLLBACK")
          ) {
            logger.error(
              `Stack ${stackName} operation failed with status: ${status}`,
            );
            await this.handleFailedStack(
              stackName,
              (await cfClient.config.region()) as string,
            );
            throw new Error(`Stack ${stackName} failed with status ${status}`);
          }
        }
      } catch (error: unknown) {
        logger.warning(
          `Error describing stack ${stackName} during wait: ${(error as Error).message}`,
        );
        // Consider specific error handling here, e.g., if stack is deleted during wait
        if ((error as Error).message?.includes("does not exist")) {
          throw new Error(`Stack ${stackName} was deleted during wait.`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(
      `Stack ${stackName} operation timeout after ${maxWaitTime / 1000 / 60} minutes`,
    );
  }

  private isFinalStatus(status: StackStatus): boolean {
    const finalStatuses: StackStatus[] = [
      StackStatus.CREATE_COMPLETE,
      StackStatus.CREATE_FAILED,
      StackStatus.ROLLBACK_COMPLETE,
      StackStatus.ROLLBACK_FAILED,
      StackStatus.UPDATE_COMPLETE,
      StackStatus.UPDATE_ROLLBACK_COMPLETE,
      StackStatus.UPDATE_ROLLBACK_FAILED,
      StackStatus.DELETE_COMPLETE,
      StackStatus.DELETE_FAILED,
      StackStatus.IMPORT_COMPLETE,
      StackStatus.IMPORT_ROLLBACK_COMPLETE,
      StackStatus.IMPORT_ROLLBACK_FAILED,
    ];
    return finalStatuses.includes(status);
  }

  private isSuccessStatus(status: StackStatus): boolean {
    // Explicitly type the array to ensure `includes` works correctly with the StackStatus enum
    const successStatuses: StackStatus[] = [
      StackStatus.CREATE_COMPLETE,
      StackStatus.UPDATE_COMPLETE,
      StackStatus.IMPORT_COMPLETE,
    ];
    return successStatuses.includes(status);
  }

  private async getStackParameters(
    stackType: StackType,
    stage: string,
    options: DeploymentOptions,
  ): Promise<Parameter[]> {
    const allParameters: Parameter[] = [];

    // Add common parameters for all stacks
    allParameters.push({ ParameterKey: "Stage", ParameterValue: stage });

    // Add parameters based on stack type
    if (stackType !== StackType.WAF) {
      // Corrected: Pass both stackType and stage
      allParameters.push({
        ParameterKey: "TemplateBucketName",
        ParameterValue: getTemplateBucketName(stackType, stage),
      });
    }

    // Add WebACL parameters if stack depends on WAF
    const config = getProjectConfig(stackType);
    if (config.dependsOn?.includes(StackType.WAF)) {
      const webAclId =
        (await this.outputsManager.findOutputValueByCandidates(
          stage,
          candidateExportNames(StackType.WAF, stage, "web-acl-id"),
        )) ||
        (await this.outputsManager.getOutputValue(
          StackType.WAF,
          stage,
          "WebACLId",
        ));
      if (webAclId) {
        allParameters.push({
          ParameterKey: "WebACLId",
          ParameterValue: webAclId,
        });
      } else {
        logger.warning(
          "WebACLId not found in WAF outputs, skipping parameter.",
        );
      }

      const webAclArn =
        (await this.outputsManager.findOutputValueByCandidates(
          stage,
          candidateExportNames(StackType.WAF, stage, "web-acl-arn"),
        )) ||
        (await this.outputsManager.getOutputValue(
          StackType.WAF,
          stage,
          "WebACLArn",
        ));
      if (webAclArn) {
        allParameters.push({
          ParameterKey: "WebACLArn",
          ParameterValue: webAclArn,
        });
      } else {
        logger.warning(
          "WebACLArn not found in WAF outputs, skipping parameter.",
        );
      }
    }

    if (stackType === StackType.CWL) {
      const templateBucketName =
        (await this.outputsManager.findOutputValueByCandidates(
          stage,
          candidateExportNames(StackType.Shared, stage, "template-bucket-name"),
        )) ||
        (await this.outputsManager.getOutputValue(
          StackType.Shared,
          stage,
          "TemplateBucketName",
        ));
      if (templateBucketName) {
        allParameters.push({
          ParameterKey: "SharedTemplateBucketName",
          ParameterValue: templateBucketName,
        });
      } else {
        logger.warning(
          "TemplateBucketName not found in Shared outputs, skipping parameter.",
        );
      }
    }

    // Add KMS parameters if stack depends on Shared (which provides KMS)
    if (config.dependsOn?.includes(StackType.Shared)) {
      // Add KMS parameters from Shared stack
      const kmsKeyId =
        (await this.outputsManager.findOutputValueByCandidates(
          stage,
          candidateExportNames(StackType.Shared, stage, "kms-key-id"),
        )) ||
        (await this.outputsManager.getOutputValue(
          StackType.Shared,
          stage,
          "KMSKeyId",
        ));
      if (kmsKeyId) {
        allParameters.push({
          ParameterKey: "KMSKeyId",
          ParameterValue: kmsKeyId,
        });
      } else {
        logger.warning(
          "KMSKeyId not found in Shared outputs, skipping parameter.",
        );
      }

      const kmsKeyArn =
        (await this.outputsManager.findOutputValueByCandidates(
          stage,
          candidateExportNames(StackType.Shared, stage, "kms-key-arn"),
        )) ||
        (await this.outputsManager.getOutputValue(
          StackType.Shared,
          stage,
          "KMSKeyArn",
        ));
      if (kmsKeyArn) {
        allParameters.push({
          ParameterKey: "KMSKeyArn",
          ParameterValue: kmsKeyArn,
        });
      } else {
        logger.warning(
          "KMSKeyArn not found in Shared outputs, skipping parameter.",
        );
      }
    }

    return allParameters;
  }

  private async postDeploymentTasks(
    stackType: StackType,
    options: DeploymentOptions,
  ): Promise<void> {
    if (stackType === StackType.CWL && !options.skipUserCreation) {
      // Corrected: Call createAdminUser and pass the necessary options
      await this.userManager.createAdminUser({
        stage: options.stage,
        adminEmail: options.adminEmail,
        region: options.region,
      });
    }
  }

  private async promptForAdminEmail(): Promise<string> {
    const { adminEmail } = await inquirer.prompt([
      {
        type: "input",
        name: "adminEmail",
        message: "Enter admin email address for user creation:",
        default: "admin@example.com",
        validate: (input: string) =>
          REGEX.EMAIL.test(input.trim()) ||
          "Please enter a valid email address.", // Use REGEX.EMAIL
      },
    ]);
    return adminEmail.trim();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async removeAllStacks(options: DeploymentOptions): Promise<void> {
    // Get removal order dynamically (reverse of deployment order)
    const stacksToRemove = this.dependencyValidator.getRemovalOrder();

    logger.info(`========================================`);
    logger.info(`Starting removal of ALL stacks for stage: ${options.stage}`);
    logger.info(`========================================`);
    logger.info(
      `Stacks will be removed in reverse dependency order: ${stacksToRemove.join(" → ")}`,
    );
    logger.info(`This process may take several minutes...`);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < stacksToRemove.length; i++) {
      const stackType = stacksToRemove[i];
      try {
        logger.info(
          `\n[${i + 1}/${stacksToRemove.length}] Processing ${stackType} stack...`,
        );
        await this.removeStack(stackType, options);
        successCount++;
        logger.success(
          `✓ [${i + 1}/${stacksToRemove.length}] ${stackType} stack removal completed`,
        );
      } catch (error: unknown) {
        failureCount++;
        logger.error(
          `✗ [${i + 1}/${stacksToRemove.length}] Failed to remove ${stackType} stack: ${(error as Error).message}`,
        );
        logger.warning(`Continuing with remaining stacks...`);
      }
    }

    logger.info(`\n========================================`);
    logger.info(`Stack removal process completed:`);
    logger.info(`✓ Successfully removed: ${successCount} stacks`);
    if (failureCount > 0) {
      logger.warning(`✗ Failed to remove: ${failureCount} stacks`);
    }
    logger.info(`========================================`);

    if (failureCount === 0) {
      logger.success("🎉 All stacks removed successfully!");
    } else {
      logger.warning(
        `⚠️  Some stacks failed to remove. Check the logs above for details.`,
      );
    }
  }
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
              // This method needs to be public
              adminEmail = await (
                deploymentManager as any
              ).promptForAdminEmail();
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

          // Ask about skipping WAF (expensive for dev environments)
          let skipWAF = false;
          if (
            stage === "dev" &&
            (stack === "all" ||
              stack === StackType.TheStoryHub ||
              stack === StackType.CWL)
          ) {
            const { skipWAFPrompt } = await inquirer.prompt([
              {
                type: "confirm",
                name: "skipWAFPrompt",
                message:
                  "Skip WAF deployment? (WAF is expensive, recommended to skip for dev environments)",
                default: true,
              },
            ]);
            skipWAF = skipWAFPrompt;
          }

          const options: DeploymentOptions = {
            stage,
            adminEmail,
            skipUserCreation: !adminEmail,
            autoDeleteFailedStacks: true,
            skipFrontendBuild,
            disableRollback,
            skipWAF,
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

          // Run seeding
          await seedDB({
            region,
            tableName,
            stage,
            appName,
            skipConfirmation: false, // Require confirmation for manual reseed
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
