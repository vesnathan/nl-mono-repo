#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import { AwsUtils } from './utils/aws-utils';
import { FrontendDeploymentManager } from './utils/frontend-deployment';
import { UserSetupManager } from './utils/user-setup';
import { getAwsCredentials } from './utils/aws-credentials';
import { 
  DeploymentOptions, 
  StackType, 
  getStackName, 
  getTemplateBucketName,
  getTemplateBody,
  ForceDeleteOptions
} from './types';
import { deployShared } from './packages/shared/shared';
import { deployCwl } from './packages/cwl/cwl';
import { ForceDeleteManager } from './utils/force-delete-utils';
import { OutputsManager } from './outputs-manager';
import { DependencyValidator } from './dependency-validator';
import { 
  CloudFormationClient, 
  CreateStackCommand, 
  UpdateStackCommand, 
  DeleteStackCommand,
  DescribeStacksCommand,
  StackStatus 
} from '@aws-sdk/client-cloudformation';
import { S3Client } from '@aws-sdk/client-s3';

// Load environment variables
config();

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

  constructor(region = 'ap-southeast-2') {
    this.region = region;
    this.cfClient = new CloudFormationClient({ region });
    this.frontendManager = new FrontendDeploymentManager(region);
    this.userManager = new UserSetupManager(region);
    this.outputsManager = new OutputsManager();
    this.dependencyValidator = new DependencyValidator();
    // Initialize ForceDeleteManager with the base region. Regional instances will be created as needed.
    this.forceDeleteManager = new ForceDeleteManager(this.region);
  }

  public getRegion(): string {
    return this.region;
  }

  async initializeAws(): Promise<void> {
    try {
      const credentials = await getAwsCredentials();
      this.awsUtils = new AwsUtils(this.region, credentials);
      logger.success('AWS credentials initialized');
    } catch (error: any) {
      logger.error(`Failed to initialize AWS credentials: ${error.message}`);
      throw error;
    }
  }

  private async checkAndCleanupFailedStack(stackType: StackType, options: DeploymentOptions): Promise<void> {
    const stackName = getStackName(stackType, options.stage);
    const region = stackType === 'waf' ? 'us-east-1' : options.region || this.region;
    const client = region !== this.region ? new CloudFormationClient({ region, credentials: this.cfClient.config.credentials }) : this.cfClient;

    try {
        const describeCommand = new DescribeStacksCommand({ StackName: stackName });
        const response = await client.send(describeCommand);
        const stack = response.Stacks?.[0];
        if (stack && (stack.StackStatus === StackStatus.CREATE_FAILED || stack.StackStatus === StackStatus.ROLLBACK_COMPLETE || stack.StackStatus === StackStatus.ROLLBACK_FAILED)) {
            logger.warning(`Stack ${stackName} is in a failed state (${stack.StackStatus}). Attempting to delete it.`);
            await this.removeStack(stackType, options);
        }
    } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
            // Stack doesn't exist, nothing to clean up
        } else {
            logger.error(`Error checking status of stack ${stackName} for cleanup: ${error.message}`);
        }
    }
  }


  async deployStack(stackType: StackType, options: DeploymentOptions): Promise<void> {
    const { stage } = options;
    const effectiveRegion = stackType === 'waf' ? 'us-east-1' : options.region || this.region;

    const deploymentOptionsWithRegion: DeploymentOptions = {
      ...options,
      region: effectiveRegion,
    };

    try {
      logger.info(`Starting deployment of ${stackType} stack for stage: ${stage} in region ${effectiveRegion}`);

      const dependenciesValid = await this.dependencyValidator.validateDependencies(stackType, stage);
      if (!dependenciesValid) {
        throw new Error(`Dependency validation failed for ${stackType} stack`);
      }

      if (deploymentOptionsWithRegion.autoDeleteFailedStacks) {
        await this.checkAndCleanupFailedStack(stackType, deploymentOptionsWithRegion);
      }
      
      // WAF stack is deployed in us-east-1. Other stacks use the region from options or the default.
      if (stackType === 'waf') {
          const wafDeployer = effectiveRegion === this.region ? this : new DeploymentManager('us-east-1');
          if (effectiveRegion !== this.region) await wafDeployer.initializeAws(); // Initialize if new instance
          await wafDeployer.deployStackInternal(stackType, deploymentOptionsWithRegion);
      } else if (stackType === 'shared') {
        // Corrected: deployShared expects only options
        await deployShared(deploymentOptionsWithRegion);
      } else if (stackType === 'cwl') {
        // Corrected: deployCwl expects only options
        await deployCwl(deploymentOptionsWithRegion);
      } else {
        // Fallback to deployStackInternal for other types if any, or could throw error
        await this.deployStackInternal(stackType, deploymentOptionsWithRegion);
      }

      await this.outputsManager.saveStackOutputs(stackType, stage, effectiveRegion);
      logger.success(`Successfully deployed ${stackType} stack in ${effectiveRegion}`);
      await this.postDeploymentTasks(stackType, deploymentOptionsWithRegion);

    } catch (error: any) {
      logger.error(`Failed to deploy ${stackType} stack: ${error.message}`);
      if (options.autoDeleteFailedStacks) {
        const stackName = getStackName(stackType, options.stage);
        await this.handleFailedStack(stackName, effectiveRegion);
      }
      throw error;
    }
  }

  public async deployStackInternal(stackType: StackType, options: DeploymentOptions): Promise<void> {
    const { stage, region } = options;
    const stackName = getStackName(stackType, stage);
    const templateBody = await getTemplateBody(stackType); // Stage might not be needed if template name is fixed by type
    const parameters = await this.getStackParameters(stackType, stage, options);
    
    const client = region === this.region ? this.cfClient : new CloudFormationClient({ region, credentials: this.cfClient.config.credentials });

    logger.info(`Deploying stack ${stackName} in region ${region}`);

    if (await this.stackExists(stackName, client)) {
      logger.info(`Stack ${stackName} already exists, updating...`);
      await this.updateStack(stackName, templateBody, parameters, client);
    } else {
      logger.info(`Stack ${stackName} does not exist, creating...`);
      await this.createStack(stackName, templateBody, parameters, client);
    }
    await this.waitForStackCompletion(stackName, client);
  }

  private async handleFailedStack(stackName: string, region?: string): Promise<void> {
    logger.warning(`Stack ${stackName} failed. Attempting to gather failure details.`);
    try {
      // Corrected: awsUtils.getStackFailureDetails expects stackName and region string
      const effectiveRegion = region || (await this.cfClient.config.region()) as string;
      await this.awsUtils.getStackFailureDetails(stackName, effectiveRegion);
      logger.info(`Further cleanup or deletion for ${stackName} might be required.`);
    } catch (error: any) {
      logger.error(`Error while handling failed stack ${stackName}: ${error.message}`);
    }
  }

  public async stackExists(stackName: string, client?: CloudFormationClient): Promise<boolean> {
    const cfClient = client || this.cfClient;
    try {
      const command = new DescribeStacksCommand({ StackName: stackName });
      await cfClient.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
        return false;
      }
      // Corrected: logger.warn to logger.warning
      logger.warning(`Error checking if stack ${stackName} exists: ${error.message}`);
      return false; // Assume not exists or inaccessible on other errors
    }
  }

  public async createStack(stackName: string, templateBody: string, parameters: any[], client?: CloudFormationClient): Promise<void> {
    const cfClient = client || this.cfClient;
    const command = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: parameters,
      Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
      EnableTerminationProtection: false
    });
    await cfClient.send(command);
  }

  public async updateStack(stackName: string, templateBody: string, parameters: any[], client?: CloudFormationClient): Promise<void> {
    const cfClient = client || this.cfClient;
    try {
      const command = new UpdateStackCommand({
        StackName: stackName,
        TemplateBody: templateBody,
        Parameters: parameters,
        Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
      });
      await cfClient.send(command);
    } catch (error: any) {
      if (error.message?.includes('No updates are to be performed')) {
        logger.info(`Stack ${stackName} is already up to date`);
        return;
      }
      throw error;
    }
  }

  public async waitForStackCompletion(stackName: string, client?: CloudFormationClient): Promise<void> {
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
        logger.info(`Stack ${stackName} status: ${status}`);

        if (this.isFinalStatus(status)) {
          if (this.isSuccessStatus(status)) {
            return;
          } else {
            // Corrected: awsUtils.getStackFailureDetails expects stackName and region string
            const stackRegion = (await cfClient.config.region()) as string;
            await this.awsUtils.getStackFailureDetails(stackName, stackRegion);
            throw new Error(`Stack ${stackName} operation failed with status: ${status}. Reason: ${stack.StackStatusReason}`);
          }
        }
        await this.sleep(pollInterval);
      } catch (error: any) {
        // If stack does not exist, it might have been deleted by another process or failed very early
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
             // Corrected: logger.warn to logger.warning
             logger.warning(`Stack ${stackName} not found while waiting for completion. It might have been deleted or failed to create.`);
             throw new Error(`Stack ${stackName} not found while waiting for completion.`);
        }
        logger.error(`Error checking stack ${stackName} status: ${error.message}`);
        throw error;
      }
    }
    throw new Error(`Stack ${stackName} operation timeout after ${maxWaitTime / 1000 / 60} minutes`);
  }

  private isFinalStatus(status: StackStatus): boolean {
    const finalStatuses: StackStatus[] = [
      StackStatus.CREATE_COMPLETE, StackStatus.CREATE_FAILED, StackStatus.ROLLBACK_COMPLETE, StackStatus.ROLLBACK_FAILED,
      StackStatus.UPDATE_COMPLETE, StackStatus.UPDATE_ROLLBACK_COMPLETE, StackStatus.UPDATE_ROLLBACK_FAILED,
      StackStatus.DELETE_COMPLETE, StackStatus.DELETE_FAILED, StackStatus.IMPORT_COMPLETE, StackStatus.IMPORT_ROLLBACK_COMPLETE, StackStatus.IMPORT_ROLLBACK_FAILED
    ];
    return finalStatuses.includes(status);
  }

  private isSuccessStatus(status: StackStatus): boolean {
    // Explicitly type the array to ensure `includes` works correctly with the StackStatus enum
    const successStatuses: StackStatus[] = [
      StackStatus.CREATE_COMPLETE, 
      StackStatus.UPDATE_COMPLETE, 
      StackStatus.IMPORT_COMPLETE
    ];
    return successStatuses.includes(status);
  }

  private async getStackParameters(stackType: StackType, stage: string, options: DeploymentOptions): Promise<any[]> {
    const parameters = [
      { ParameterKey: 'Stage', ParameterValue: stage },
      { ParameterKey: 'Region', ParameterValue: options.region || this.region } // Use effective region
    ];
    if (stackType === 'cwl' && options.adminEmail) {
      parameters.push({ ParameterKey: 'AdminEmail', ParameterValue: options.adminEmail });
    }
    return parameters;
  }

  private async postDeploymentTasks(stackType: StackType, options: DeploymentOptions): Promise<void> {
    if (stackType === 'cwl' && !options.skipUserCreation) {
      logger.info('Setting up admin user...');
      try {
        let adminEmail = options.adminEmail;
        if (!adminEmail) {
          adminEmail = await this.promptForAdminEmail();
        }
        await this.userManager.createAdminUser({
          stage: options.stage,
          adminEmail: adminEmail,
          region: options.region || this.region // Use effective region
        });
        logger.success('Admin user setup completed');
      } catch (error: any) {
        logger.warning(`Admin user setup failed: ${error.message}`);
      }
    }
  }

  private async promptForAdminEmail(): Promise<string> {
    const { adminEmail } = await inquirer.prompt([
      {
        type: 'input', name: 'adminEmail', message: 'Enter admin email address for user creation:',
        default: 'admin@example.com',
        validate: (input: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(input.trim()) || 'Please enter a valid email address.'
      }
    ]);
    return adminEmail.trim();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async removeStack(stackType: StackType, options: DeploymentOptions): Promise<void> {
    const { stage } = options;
    const stackName = getStackName(stackType, stage);
    const stackRegion = stackType === 'waf' ? 'us-east-1' : options.region || this.region;

    const client = stackRegion !== this.region ? new CloudFormationClient({ region: stackRegion, credentials: this.cfClient.config.credentials }) : this.cfClient;

    logger.info(`Removing stack: ${stackName} in region ${stackRegion}`);

    try {
      let stackActuallyExists = false;
      try {
        await client.send(new DescribeStacksCommand({ StackName: stackName }));
        stackActuallyExists = true;
      } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
          logger.info(`Stack ${stackName} does not exist. S3 cleanup will proceed based on naming convention.`);
        } else {
          throw error; 
        }
      }
      
      logger.info(`Attempting to empty S3 buckets for stack type ${stackType}, name ${stackName}...`);
      
      let fdmForRegion = this.forceDeleteManager;
      if (stackRegion !== this.region) {
        logger.info(`Creating ForceDeleteManager for region ${stackRegion} for S3 cleanup.`);
        fdmForRegion = new ForceDeleteManager(stackRegion); // Corrected: Removed incorrect credentials argument
      }
      
      const baseIdentifier = `nlmonorepo-${stackType}`; 
      await fdmForRegion.emptyStackS3Buckets(baseIdentifier, stackType, stage);
      logger.info(`S3 bucket emptying attempt complete for stack ${stackName}.`);

      if (!stackActuallyExists) {
        logger.info(`Stack ${stackName} did not exist. Attempting to delete conventionally named S3 buckets for ${baseIdentifier} in stage ${stage}.`);
        try {
          // This will be the new method to add to ForceDeleteManager
          await fdmForRegion.deleteConventionalBuckets(baseIdentifier, stackType, stage);
          logger.info(`Deletion attempt of conventionally named S3 buckets complete for ${baseIdentifier}, stage ${stage}.`);
        } catch (error: any) {
          logger.error(`Error deleting conventionally named S3 buckets for ${baseIdentifier}, stage ${stage}: ${error.message}`);
        }
      }

      if (stackActuallyExists) {
        const deleteCommand = new DeleteStackCommand({ StackName: stackName });
        await client.send(deleteCommand);
        logger.info(`Stack ${stackName} removal initiated. Waiting for completion...`);
        await this.waitForStackDeletion(stackName, client);
        logger.success(`Stack ${stackName} removed successfully`);
      } else {
         // Message about stack deletion already logged or handled by the new block above for bucket deletion
         logger.info(`Stack ${stackName} did not exist, so no CloudFormation stack deletion was performed.`);
      }

    } catch (error: any) {
      logger.error(`Failed to remove stack ${stackName}: ${error.message}`);
      if (stackType === 'waf' && error.message?.includes('WAFV2 WebACL')) {
        logger.warning(`Hint: WAF ACLs might need to be disassociated from resources before the WAF stack can be deleted.`);
      }
      // Do not re-throw if the main goal is to continue with other stacks in removeAllStacks
    }
  }
  
  // Unified waitForStackDeletion
  private async waitForStackDeletion(stackName: string, client: CloudFormationClient, maxWaitMinutes = 30): Promise<void> {
    const maxWaitTime = maxWaitMinutes * 60 * 1000;
    const pollInterval = 30 * 1000;
    const startTime = Date.now();

    logger.info(`Waiting for stack ${stackName} deletion to complete (max ${maxWaitMinutes} minutes)...`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await client.send(new DescribeStacksCommand({ StackName: stackName }));
        const stack = response.Stacks?.[0];

        if (!stack) { 
          logger.success(`Stack ${stackName} has been successfully deleted (no stack data returned).`);
          return;
        }

        const status = stack.StackStatus as StackStatus;
        logger.info(`Stack ${stackName} status: ${status}`);

        if (status === StackStatus.DELETE_COMPLETE) {
          logger.success(`Stack ${stackName} has been successfully deleted.`);
          return;
        } else if (status === StackStatus.DELETE_FAILED) {
          logger.error(`Stack ${stackName} deletion failed. Status: ${status}, Reason: ${stack.StackStatusReason}`);
          // Corrected: Pass region string to getStackFailureDetails
          const stackRegion = (await client.config.region()) as string;
          await this.awsUtils.getStackFailureDetails(stackName, stackRegion);
          throw new Error(`Stack ${stackName} deletion failed. Status: ${status}. Reason: ${stack.StackStatusReason}`);
        }
        
        const terminalFailureStatuses: StackStatus[] = [StackStatus.ROLLBACK_COMPLETE, StackStatus.ROLLBACK_FAILED, StackStatus.UPDATE_ROLLBACK_FAILED];
        if (terminalFailureStatuses.includes(status)) {
            logger.error(`Stack ${stackName} is in a non-deletable terminal state: ${status}. Manual intervention may be required.`);
            throw new Error(`Stack ${stackName} is in a non-deletable terminal state: ${status}`);
        }
        await this.sleep(pollInterval);
      } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
          logger.success(`Stack ${stackName} has been successfully deleted (confirmed by describeStacks error).`);
          return;
        }
        logger.error(`Error waiting for stack ${stackName} deletion: ${error.message}. Retrying...`);
        await this.sleep(pollInterval); // Wait before retrying on other errors
      }
    }
    throw new Error(`Timeout waiting for stack ${stackName} to delete after ${maxWaitMinutes} minutes.`);
  }

  async removeAllStacks(options: DeploymentOptions): Promise<void> {
    logger.info(`Removing all stacks for stage: ${options.stage}`);
    const stacksToRemove: StackType[] = ['cwl', 'shared', 'waf']; 
    for (const stackType of stacksToRemove) {
        try {
            await this.removeStack(stackType, options);
        } catch (error: any) {
            logger.error(`Failed to remove stack ${stackType} during removeAll: ${error.message}. Continuing with others.`);
        }
    }
    logger.success('Finished removing all stacks.');
  }
}

// --- Commander Program Setup ---
async function main() {
  const deploymentManager = new DeploymentManager();

  program
    .name('deploy-script')
    .description('CLI for deploying and managing AWS CloudFormation stacks')
    .version('1.0.0');

  program
    .command('deploy')
    .description('Deploy a specific stack or all stacks')
    .option('--stage <stage>', 'Deployment stage (e.g., dev, prod)', process.env.STAGE || 'dev')
    .option('--stack <stack>', 'Stack to deploy (waf, shared, cwl, all)', 'all')
    .option('--admin-email <email>', 'Admin email for CWL stack user creation')
    .option('--skip-user-creation', 'Skip CWL admin user creation', false)
    .option('--auto-delete-failed-stacks', 'Automatically delete failed stacks before deployment', false)
    .action(async (cmdOptions) => {
      await deploymentManager.initializeAws();
      const deploymentOptions: DeploymentOptions = {
        stage: cmdOptions.stage,
        region: deploymentManager.getRegion(), // Base region
        adminEmail: cmdOptions.adminEmail,
        skipUserCreation: cmdOptions.skipUserCreation,
        autoDeleteFailedStacks: cmdOptions.autoDeleteFailedStacks,
        // stackUpdateStrategy removed as it's not in DeploymentOptions type
      };

      if (cmdOptions.stack === 'all') {
        // Special handling for 'all' to use dependency order
        const stacksInOrder = deploymentManager['dependencyValidator'].getDeploymentOrder();
        for (const stackType of stacksInOrder) {
            await deploymentManager.deployStack(stackType, deploymentOptions);
        }
      } else if (['waf', 'shared', 'cwl'].includes(cmdOptions.stack)) {
        await deploymentManager.deployStack(cmdOptions.stack as StackType, deploymentOptions);
      } else {
        logger.error('Invalid stack type specified. Must be one of: waf, shared, cwl, all.');
        program.help();
      }
    });

  program
    .command('remove')
    .description('Remove deployed stacks')
    .option('-s, --stage <stage>', 'Deployment stage')
    .option('--all', 'Remove all stacks for the specified stage')
    .option('--stack-type <stackType>', 'Type of the stack to remove (e.g., cwl, shared, waf)')
    .option('--stack-identifier <stackIdentifier>', 'Identifier of the stack to remove (e.g., name or ARN)')
    .option('-r, --region <region>', 'AWS region for the stack (optional, defaults to current)')
    .option('--force', 'Force delete stack resources like S3 buckets if CloudFormation deletion fails or stack does not exist (use with caution)')
    .action(async (options: { stage?: string; all?: boolean; stackType?: string; stackIdentifier?: string; region?: string; force?: boolean }, command: Command) => {
      const { stage: commandStage, all, stackType, stackIdentifier, region, force } = options;
      let stage = commandStage;
      let promptedForStage = false;

      // Check if stage needs to be prompted
      if (all && command.getOptionValueSource('stage') !== 'cli') {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'stage',
            message: 'Please enter the stage to remove all stacks from:',
            validate: (input: string) => !!input || 'Stage cannot be empty.',
          },
        ]);
        stage = answers.stage;
        promptedForStage = true;
      } else if (!all && !stackType && !stackIdentifier && command.getOptionValueSource('stage') !== 'cli') {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'stage',
            message: 'Please enter the stage for the stack (or to list available stacks if none specified):',
            // Allow empty input if user wants to list stacks before deciding
            // validate: (input: string) => !!input || 'Stage cannot be empty.',
          },
        ]);
        // If the user provides a stage, use it. Otherwise, stage might remain undefined.
        if (answers.stage) {
          stage = answers.stage;
          promptedForStage = true;
        } else if (!answers.stage && !stackType && !stackIdentifier) {
          // If no stage provided and no specific stack, it's an ambiguous single remove.
          // Enforce stage here if not 'all' and no specific stack details are provided.
          logger.error('Stage is required for this operation. Please provide --stage or specify stack details.');
          return; 
        }
      }

      // Ensure stage is defined before proceeding with operations that require it.
      if (!stage && (all || stackType || stackIdentifier)) {
        logger.error('Error: Stage is undefined but required for the operation.');
        if (!promptedForStage) {
          logger.error('The stage was not provided via --stage option and prompting failed or was skipped. Please specify --stage.');
        }
        return;
      }
      
      // At this point, if 'all', 'stackType', or 'stackIdentifier' is set, 'stage' must be defined.
      // If none of them are set, 'stage' might be undefined, but such a command isn't valid for actual removal.
      if (!all && !stackType && !stackIdentifier && !stage) {
        logger.error('Please specify --all, or --stack-type, or provide a --stage for context.');
        program.help();
        return;
      }

      const deploymentOptions: DeploymentOptions = {
        stage: stage!, // stage is now guaranteed to be defined if an operation proceeds
        region: deploymentManager.getRegion(), // Base region
      };

      if (all) {
        logger.info(`Preparing to remove all stacks for stage: ${stage}`);
        await deploymentManager.removeAllStacks(deploymentOptions);
      } else if (stackType && ['waf', 'shared', 'cwl'].includes(stackType)) {
        logger.info(`Preparing to remove stack ${stackType} for stage: ${stage}`);
        await deploymentManager.removeStack(stackType as StackType, deploymentOptions);
      } else {
        logger.error('Please specify a valid stack to remove (--stack <type>) or use --all.');
        program.help();
      }
    });

  program
    .command('force-remove')
    .description('Force remove deployed stacks and their S3 buckets (use with extreme caution)')
    .option('-s, --stage <stage>', 'Deployment stage')
    .option('--all', 'Force remove all stacks for the specified stage')
    .option('--stack-type <stackType>', 'Type of the stack to force remove (e.g., cwl, shared, waf)')
    .option('--stack-identifier <stackIdentifier>', 'Identifier of the stack to force remove (e.g., name or ARN)')
    .option('-r, --region <region>', 'AWS region for the stack (optional, defaults to current)')
    .action(async (options: { stage?: string; all?: boolean; stackType?: string; stackIdentifier?: string; region?: string }, command: Command) => {
      const { stage: commandStage, all, stackType, stackIdentifier, region } = options;
      let stage = commandStage;
      let promptedForStage = false;

      // Check if stage needs to be prompted
      if (all && command.getOptionValueSource('stage') !== 'cli') {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'stage',
            message: 'Please enter the stage to force-remove all stacks from:',
            validate: (input: string) => !!input || 'Stage cannot be empty.',
          },
        ]);
        stage = answers.stage;
        promptedForStage = true;
      } else if (!all && !stackType && !stackIdentifier && command.getOptionValueSource('stage') !== 'cli') {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'stage',
            message: 'Please enter the stage for the stack to force-remove:',
            validate: (input: string) => !!input || 'Stage cannot be empty.',
          },
        ]);
        stage = answers.stage;
        promptedForStage = true;
      }

      // Ensure stage is defined before proceeding with operations that require it.
      if (!stage) { // Stage is mandatory for all force-remove operations
        logger.error('Error: Stage is undefined but required for force-remove.');
        if (!promptedForStage) {
           logger.error('The stage was not provided via --stage option and prompting failed or was skipped. Please specify --stage.');
        }
        return;
      }

      logger.info(`Selected stage for force-removal: ${stage}`);

      const forceDeleteOpts: ForceDeleteOptions = {
        stage: stage, // stage is now guaranteed to be defined
        // skipS3Cleanup: undefined // This was cmdOptions.skipS3Cleanup, but skipS3Cleanup is not an option for force-remove
      };

      const stacksToProcess: StackType[] = all 
        ? ['cwl', 'shared', 'waf'] 
        : [stackType as StackType];

      for (const currentStackType of stacksToProcess) { // Renamed stackType to currentStackType to avoid conflict with destructured stackType
        if (!all && !['waf', 'shared', 'cwl'].includes(currentStackType)) {
          logger.error('Please specify a valid stack to force remove (--stack <type>) or use --all.');
          program.help();
          return;
        }

        const stackRegion = currentStackType === 'waf' ? 'us-east-1' : deploymentManager.getRegion();
        let fdmForStackRegion = deploymentManager.forceDeleteManager;

        if (stackRegion !== deploymentManager.getRegion()) {
          logger.info(`Creating ForceDeleteManager for region ${stackRegion} for stack ${currentStackType}.`);
          fdmForStackRegion = new ForceDeleteManager(stackRegion);
        }
        
        const baseIdentifier = `nlmonorepo-${currentStackType}`;
        const fullStackName = getStackName(currentStackType, stage);

        logger.info(`Force removing stack: ${fullStackName} (type: ${currentStackType}) for stage: ${stage} in region ${stackRegion}`);
        try {
          await fdmForStackRegion.forceDeleteStack(baseIdentifier, currentStackType, stage, forceDeleteOpts.skipS3Cleanup);
        } catch (error: any) {
          logger.error(`Failed to force remove stack ${fullStackName}: ${error.message}. Continuing if --all was specified.`);
          if (!all) {
            // If not --all, rethrow to stop execution for a single failed stack
            throw error; 
          }
        }
      }
      if (all) {
        logger.info(`Finished force removing all specified stacks for stage: ${stage}`);
      }
    });
    
  const frontend = program.command('frontend').description('Frontend deployment commands');
  frontend
    .command('deploy')
    .description('Build, upload and invalidate frontend')
    .option('--stage <stage>', 'Deployment stage', process.env.STAGE || 'dev')
    .action(async (options) => {
        await deploymentManager.initializeAws();
        await deploymentManager['frontendManager'].deployFrontend({stage: options.stage});
    });

  frontend
    .command('build')
    .description('Build frontend only')
    .option('--stage <stage>', 'Deployment stage', process.env.STAGE || 'dev')
    .action(async (options) => {
        await deploymentManager.initializeAws();
        await deploymentManager['frontendManager'].deployFrontend({stage: options.stage, skipUpload: true, skipInvalidation: true });
    });
  frontend
    .command('upload')
    .description('Upload frontend to S3 (assumes already built)')
    .option('--stage <stage>', 'Deployment stage', process.env.STAGE || 'dev')
    .action(async (options) => {
        await deploymentManager.initializeAws();
        await deploymentManager['frontendManager'].deployFrontend({stage: options.stage, skipBuild: true, skipInvalidation: true});
    });
  frontend
    .command('invalidate')
    .description('Invalidate CloudFront cache for frontend')
    .option('--stage <stage>', 'Deployment stage', process.env.STAGE || 'dev')
    .action(async (options) => {
        await deploymentManager.initializeAws();
        await deploymentManager['frontendManager'].deployFrontend({stage: options.stage, skipBuild: true, skipUpload: true});
    });


  // Interactive mode (optional, can be expanded)
  program
    .command('interactive', { isDefault: true })
    .description('Run in interactive mode')
    .action(async () => {
      logger.info('Interactive mode started. Choose an action:');
      // Basic interactive prompts - can be expanded significantly
      const { action } = await inquirer.prompt([
          { type: 'list', name: 'action', message: 'What do you want to do?', choices: ['deploy', 'remove', 'force-remove', 'exit'] }
      ]);

      if (action === 'exit') {
          logger.info('Exiting interactive mode.');
          process.exit(0);
      }
      
      const { stage } = await inquirer.prompt([{ type: 'input', name: 'stage', message: 'Enter stage:', default: 'dev' }]);
      
      if (action === 'deploy') {
          const { stack } = await inquirer.prompt([{ type: 'list', name: 'stack', message: 'Which stack?', choices: ['all', 'waf', 'shared', 'cwl'] }]);
          program.parse(['deploy', '--stack', stack, '--stage', stage], { from: 'user' });
      } else if (action === 'remove') {
          const { stack } = await inquirer.prompt([{ type: 'list', name: 'stack', message: 'Which stack to remove?', choices: ['all', 'waf', 'shared', 'cwl'] }]);
          if (stack === 'all') program.parse(['remove', '--all', '--stage', stage], { from: 'user' });
          else program.parse(['remove', '--stack', stack, '--stage', stage], { from: 'user' });
      } else if (action === 'force-remove') {
          const { stack } = await inquirer.prompt([{ type: 'list', name: 'stack', message: 'Which stack to force-remove?', choices: ['all', 'waf', 'shared', 'cwl'] }]);
          if (stack === 'all') program.parse(['force-remove', '--all', '--stage', stage], { from: 'user' });
          else program.parse(['force-remove', '--stack', stack, '--stage', stage], { from: 'user' });
      }
    });

  await program.parseAsync(process.argv);
}

main().catch(error => {
  logger.error(`Unhandled error in main: ${error.message}`);
  if (error.stack) {
    logger.error(error.stack);
  }
  process.exit(1);
});