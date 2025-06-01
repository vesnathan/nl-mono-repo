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
  getTemplateBody 
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

// Load environment variables
config();

const program = new Command();

class DeploymentManager {
  private awsUtils!: AwsUtils;
  private cfClient: CloudFormationClient;
  private frontendManager: FrontendDeploymentManager;
  private userManager: UserSetupManager;
  private outputsManager: OutputsManager;
  private dependencyValidator: DependencyValidator;
  private region: string;
  private forceDeleteManager: ForceDeleteManager;

  constructor(region = 'ap-southeast-2') {
    this.region = region;
    this.cfClient = new CloudFormationClient({ region });
    this.frontendManager = new FrontendDeploymentManager(region);
    this.userManager = new UserSetupManager(region);
    this.outputsManager = new OutputsManager();
    this.dependencyValidator = new DependencyValidator();
    this.forceDeleteManager = new ForceDeleteManager(region);
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

  async deployStack(stackType: StackType, options: DeploymentOptions): Promise<void> {
    const { stage } = options;

    try {
      logger.info(`Starting deployment of ${stackType} stack for stage: ${stage}`);

      // Validate dependencies before deployment
      const dependenciesValid = await this.dependencyValidator.validateDependencies(stackType, stage);
      if (!dependenciesValid) {
        throw new Error(`Dependency validation failed for ${stackType} stack`);
      }

      // Check for failed stacks and auto-cleanup if enabled
      if (options.autoDeleteFailedStacks) {
        await this.checkAndCleanupFailedStack(stackType, options);
      }

      // Route to appropriate deployment function
      switch (stackType) {
        case 'waf':
          logger.info('Deploying WAF stack in us-east-1 region');
          await this.deployWafStack(options);
          break;
        case 'shared':
          logger.info('Deploying Shared Resources stack');
          await deployShared(options);
          break;
        case 'cwl':
          logger.info('Deploying CloudWatch Live stack');
          await deployCwl(options);
          break;
        default:
          throw new Error(`Unknown stack type: ${stackType}`);
      }

      // Save stack outputs after successful deployment
      await this.outputsManager.saveStackOutputs(stackType, stage, this.region);

      logger.success(`Successfully deployed ${stackType} stack`);

      // Post-deployment tasks
      await this.postDeploymentTasks(stackType, options);

    } catch (error: any) {
      logger.error(`Failed to deploy ${stackType} stack: ${error.message}`);
      
      if (options.autoDeleteFailedStacks) {
        const stackName = getStackName(stackType, options.stage);
        await this.handleFailedStack(stackName);
      }
      
      throw error;
    }
  }

  private async stackExists(stackName: string): Promise<boolean> {
    try {
      const command = new DescribeStacksCommand({ StackName: stackName });
      await this.cfClient.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
        return false;
      }
      throw error;
    }
  }

  private async createStack(stackName: string, templateBody: string, parameters: any[]): Promise<void> {
    const command = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: parameters,
      Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
      EnableTerminationProtection: false
    });

    await this.cfClient.send(command);
  }

  private async updateStack(stackName: string, templateBody: string, parameters: any[]): Promise<void> {
    try {
      const command = new UpdateStackCommand({
        StackName: stackName,
        TemplateBody: templateBody,
        Parameters: parameters,
        Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
      });

      await this.cfClient.send(command);
    } catch (error: any) {
      if (error.message?.includes('No updates are to be performed')) {
        logger.info('Stack is already up to date');
        return;
      }
      throw error;
    }
  }

  private async waitForStackCompletion(stackName: string): Promise<void> {
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const pollInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await this.cfClient.send(command);
        const stack = response.Stacks?.[0];

        if (!stack) {
          throw new Error(`Stack ${stackName} not found`);
        }

        const status = stack.StackStatus as StackStatus;
        logger.info(`Stack ${stackName} status: ${status}`);

        if (this.isFinalStatus(status)) {
          if (this.isSuccessStatus(status)) {
            return;
          } else {
            await this.awsUtils.getStackFailureDetails(stackName);
            throw new Error(`Stack deployment failed with status: ${status}`);
          }
        }

        await this.sleep(pollInterval);
      } catch (error: any) {
        logger.error(`Error checking stack status: ${error.message}`);
        throw error;
      }
    }

    throw new Error(`Stack deployment timeout after ${maxWaitTime / 1000 / 60} minutes`);
  }

  private isFinalStatus(status: StackStatus): boolean {
    const finalStatuses = [
      'CREATE_COMPLETE',
      'CREATE_FAILED',
      'ROLLBACK_COMPLETE',
      'ROLLBACK_FAILED',
      'UPDATE_COMPLETE',
      'UPDATE_ROLLBACK_COMPLETE',
      'UPDATE_ROLLBACK_FAILED',
      'DELETE_COMPLETE',
      'DELETE_FAILED'
    ];
    return finalStatuses.includes(status);
  }

  private isSuccessStatus(status: StackStatus): boolean {
    return ['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(status);
  }

  private async getStackParameters(stackType: StackType, stage: string, options: DeploymentOptions): Promise<any[]> {
    const parameters = [
      { ParameterKey: 'Stage', ParameterValue: stage },
      { ParameterKey: 'Region', ParameterValue: this.region }
    ];

    // Add stack-specific parameters
    switch (stackType) {
      case 'cwl':
        if (options.adminEmail) {
          parameters.push({ ParameterKey: 'AdminEmail', ParameterValue: options.adminEmail });
        }
        break;
      case 'shared':
        // Add any shared stack specific parameters
        break;
      case 'waf':
        // Add any WAF specific parameters
        break;
    }

    return parameters;
  }

  private async postDeploymentTasks(stackType: StackType, options: DeploymentOptions): Promise<void> {
    if (stackType === 'cwl' && !options.skipUserCreation) {
      logger.info('Setting up admin user...');
      try {
        // Prompt for admin email if not provided
        let adminEmail = options.adminEmail;
        if (!adminEmail) {
          adminEmail = await this.promptForAdminEmail();
        }
        
        await this.userManager.createAdminUser({
          stage: options.stage,
          adminEmail: adminEmail,
          region: this.region
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
        type: 'input',
        name: 'adminEmail',
        message: 'Enter admin email address for user creation:',
        default: 'admin@example.com',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Email cannot be empty';
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input.trim())) {
            return 'Please enter a valid email address';
          }
          return true;
        }
      }
    ]);

    return adminEmail.trim();
  }

  private async handleFailedStack(stackName: string): Promise<void> {
    try {
      logger.info(`Attempting to force delete failed stack: ${stackName}`);
      
      // Determine stack type from name
      let stackType: StackType;
      let region = this.region;
      
      if (stackName.includes('-waf-')) {
        stackType = 'waf';
        region = 'us-east-1';
      } else if (stackName.includes('-shared-')) {
        stackType = 'shared';
      } else if (stackName.includes('-cwl-')) {
        stackType = 'cwl';
      } else {
        throw new Error(`Cannot determine stack type from name: ${stackName}`);
      }
      
      // Extract stage from stack name
      const stagePart = stackName.split('-').pop();
      if (!stagePart) {
        throw new Error(`Cannot determine stage from stack name: ${stackName}`);
      }
      
      const forceDeleteManager = new ForceDeleteManager(region);
      await forceDeleteManager.forceDeleteStack(stackType, {
        stage: stagePart,
        maxWaitMinutes: 20
      });
      
      logger.success(`Failed stack deleted with force deletion: ${stackName}`);
    } catch (error: any) {
      logger.error(`Failed to force delete failed stack: ${error.message}`);
    }
  }

  private async waitForStackDeletion(stackName: string, region?: string): Promise<void> {
    const maxWaitTime = 20 * 60 * 1000; // 20 minutes
    const pollInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();
    
    // Use the specified region or default to the instance's region
    const cfClient = region ? new CloudFormationClient({ region }) : this.cfClient;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await cfClient.send(command);
        const stack = response.Stacks?.[0];

        if (!stack) {
          return; // Stack deleted
        }

        const status = stack.StackStatus as StackStatus;
        
        if (status === 'DELETE_COMPLETE') {
          return;
        } else if (status === 'DELETE_FAILED') {
          throw new Error('Stack deletion failed');
        }

        await this.sleep(pollInterval);
      } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
          return; // Stack deleted
        }
        throw error;
      }
    }

    throw new Error('Stack deletion timeout');
  }

  async deployAll(options: DeploymentOptions): Promise<void> {
    // Get the correct deployment order based on dependencies
    const stacks = this.dependencyValidator.getDeploymentOrder();
    
    logger.info(`Deploying stacks in dependency order: ${stacks.join(' → ')}`);
    
    // For deployAll, we skip chain validation since we're deploying in the correct order
    // and dependencies will be satisfied as we deploy each stack
    logger.info('Skipping deployment chain validation for fresh deployment - will validate dependencies per stack');
    
    for (const stackType of stacks) {
      await this.deployStack(stackType, options);
    }
    
    logger.success('All stacks deployed successfully!');
  }

  async updateStackWithDependencies(stackType: StackType, options: DeploymentOptions): Promise<void> {
    const dependencyMap: Record<StackType, StackType[]> = {
      'waf': [], // WAF has no dependencies
      'shared': ['cwl'], // CWL depends on shared
      'cwl': [] // CWL has no dependents
    };

    logger.info(`Updating ${stackType} stack and its dependent stacks...`);

    // Deploy the requested stack first
    await this.deployStack(stackType, options);

    // Deploy dependent stacks
    const dependentStacks = dependencyMap[stackType];
    if (dependentStacks.length > 0) {
      logger.info(`Deploying dependent stacks: ${dependentStacks.join(', ')}`);
      
      for (const dependentStack of dependentStacks) {
        await this.deployStack(dependentStack, options);
      }
    } else {
      logger.info(`No dependent stacks to update for ${stackType}`);
    }

    logger.success(`Successfully updated ${stackType} and all dependent stacks!`);
  }

  async deployFrontend(action: 'build' | 'upload' | 'invalidate' | 'deploy', stage: string): Promise<void> {
    const options = {
      stage,
      skipBuild: action === 'upload' || action === 'invalidate',
      skipUpload: action === 'build' || action === 'invalidate',
      skipInvalidation: action === 'build' || action === 'upload'
    };

    await this.frontendManager.deployFrontend(options);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async removeStack(stackType: StackType, options: DeploymentOptions): Promise<void> {
    const stackName = getStackName(stackType, options.stage);
    
    logger.info(`Removing stack: ${stackName}`);
    
    // Validate that the stack can be safely removed
    const canRemove = await this.dependencyValidator.validateRemoval(stackType, options.stage);
    if (!canRemove) {
      throw new Error(`Cannot remove ${stackType} - dependent stacks are still deployed`);
    }
    
    try {
      // Use specialized method for WAF stack removal
      if (stackType === 'waf') {
        await this.removeWafStack(options);
      } else {
        const command = new DeleteStackCommand({ StackName: stackName });
        await this.cfClient.send(command);
        
        // Wait for deletion to complete
        await this.waitForStackDeletion(stackName);
        logger.success(`Stack deleted successfully: ${stackName}`);
      }
    } catch (error: any) {
      logger.error(`Failed to delete stack ${stackName}: ${error.message}`);
      throw error;
    }
  }

  async removeAll(options: DeploymentOptions): Promise<void> {
    // Remove stacks in reverse order of deployment
    const stacks = this.dependencyValidator.getRemovalOrder();
    const errors: string[] = [];
    
    logger.info(`Removing stacks in dependency order: ${stacks.join(' → ')}`);
    
    for (const stackType of stacks) {
      try {
        const stackName = getStackName(stackType, options.stage);
        logger.info(`Removing stack: ${stackName}`);
        await this.removeStack(stackType, options);
        logger.success(`Successfully removed ${stackType} stack`);
      } catch (error: any) {
        const errorMessage = `Failed to remove ${stackType} stack: ${error.message}`;
        logger.error(errorMessage);
        errors.push(errorMessage);
        // Continue with other stacks even if one fails
      }
    }
    
    // Clear outputs after all removals
    await this.outputsManager.clearOutputs(options.stage);
    
    if (errors.length > 0) {
      logger.warning(`Stack removal completed with ${errors.length} errors:`);
      errors.forEach(err => logger.warning(` - ${err}`));
    } else {
      logger.success('All stacks removed successfully!');
    }
  }

  async removeWafStack(options: DeploymentOptions): Promise<void> {
    const stackName = getStackName('waf', options.stage);
    const wafRegion = 'us-east-1';
    
    logger.info(`Removing WAF stack: ${stackName} from region ${wafRegion}`);
    
    try {
      // Create a CloudFormation client specific to us-east-1
      const wafCfClient = new CloudFormationClient({ 
        region: wafRegion,
        credentials: this.cfClient.config.credentials
      });
      
      // Delete the WAF stack
      const command = new DeleteStackCommand({ StackName: stackName });
      await wafCfClient.send(command);
      
      // Wait for deletion to complete
      const maxWaitTime = 20 * 60 * 1000; // 20 minutes
      const pollInterval = 30 * 1000; // 30 seconds
      const startTime = Date.now();
      
      let deleted = false;
      while (!deleted && Date.now() - startTime < maxWaitTime) {
        try {
          const describeCommand = new DescribeStacksCommand({ StackName: stackName });
          const response = await wafCfClient.send(describeCommand);
          
          const stack = response.Stacks?.[0];
          if (!stack) {
            deleted = true;
            break;
          }
          
          const status = stack.StackStatus as StackStatus;
          logger.info(`WAF stack deletion status: ${status}`);
          
          if (status === 'DELETE_COMPLETE') {
            deleted = true;
            break;
          } else if (status === 'DELETE_FAILED') {
            throw new Error('WAF stack deletion failed');
          }
          
          await this.sleep(pollInterval);
        } catch (error: any) {
          if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
            deleted = true;
            break;
          }
          throw error;
        }
      }
      
      if (deleted) {
        logger.success(`WAF stack deleted successfully: ${stackName}`);
      } else {
        throw new Error('WAF stack deletion timeout');
      }
    } catch (error: any) {
      logger.error(`Failed to delete WAF stack ${stackName}: ${error.message}`);
      throw error;
    }
  }

  async deployWafStack(options: DeploymentOptions): Promise<void> {
    const { stage } = options;
    const stackName = getStackName('waf', stage);
    const bucketName = getTemplateBucketName('waf', stage);
    const wafRegion = 'us-east-1';
    
    try {
      logger.info(`Starting WAF deployment: ${stackName} in ${wafRegion}`);
      logger.info(`WAF deployment debug: stage=${stage}, stackName=${stackName}, bucketName=${bucketName}`);
      
      // Create a CloudFormation client specific to us-east-1
      const wafCfClient = new CloudFormationClient({ 
        region: wafRegion,
        credentials: this.cfClient.config.credentials
      });
      
      // Step 1: Create templates bucket in us-east-1 (regardless of existence)
      logger.info(`Setting up templates bucket: ${bucketName}`);
      await this.awsUtils.createTemplatesBucket(bucketName, wafRegion, 'waf');
      logger.info('Templates bucket setup completed, proceeding to CloudFormation stack deployment');
      
      // Step 2: Get template body
      logger.info('Getting template body for WAF stack');
      const templateBody = await getTemplateBody('waf');
      logger.info('Template body retrieved successfully');
      
      // Step 3: Prepare parameters
      const parameters = [
        {
          ParameterKey: 'Stage',
          ParameterValue: stage
        }
      ];
      
      // Step 4: Check if CloudFormation stack exists
      let stackExists = false;
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        await wafCfClient.send(command);
        stackExists = true;
        logger.info(`WAF stack ${stackName} already exists`);
      } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
          stackExists = false;
          logger.info(`WAF stack ${stackName} does not exist`);
        } else {
          throw error;
        }
      }
      
      // Step 5: Deploy CloudFormation stack (create or update)
      if (stackExists) {
        logger.info(`Updating existing WAF stack: ${stackName} in ${wafRegion}`);
        try {
          const command = new UpdateStackCommand({
            StackName: stackName,
            TemplateBody: templateBody,
            Parameters: parameters,
            Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
          });
          
          await wafCfClient.send(command);
          logger.info('WAF stack update initiated');
        } catch (error: any) {
          if (error.message?.includes('No updates are to be performed')) {
            logger.info('WAF stack is already up to date');
            return;
          }
          throw error;
        }
      } else {
        logger.info(`Creating new WAF stack: ${stackName} in ${wafRegion}`);
        const command = new CreateStackCommand({
          StackName: stackName,
          TemplateBody: templateBody,
          Parameters: parameters,
          Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
          EnableTerminationProtection: false
        });
        
        await wafCfClient.send(command);
        logger.info('WAF stack creation initiated');
      }
      
      // Step 6: Wait for stack completion
      logger.info('Waiting for WAF stack operation to complete...');
      await this.waitForWafStackCompletion(stackName, wafCfClient);
      logger.success(`Successfully deployed WAF stack: ${stackName} in ${wafRegion}`);
      
    } catch (error: any) {
      logger.error(`Failed to deploy WAF stack: ${error.message}`);
      throw error;
    }
  }
  
  private async waitForWafStackCompletion(stackName: string, wafCfClient: CloudFormationClient): Promise<void> {
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const pollInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await wafCfClient.send(command);
        const stack = response.Stacks?.[0];
        
        if (!stack) {
          throw new Error(`Stack ${stackName} not found`);
        }
        
        const status = stack.StackStatus as StackStatus;
        logger.info(`WAF Stack ${stackName} status: ${status}`);
        
        if (this.isFinalStatus(status)) {
          if (this.isSuccessStatus(status)) {
            return;
          } else {
            // Get failure details
            throw new Error(`WAF Stack deployment failed with status: ${status}`);
          }
        }
        
        await this.sleep(pollInterval);
      } catch (error: any) {
        logger.error(`Error checking WAF stack status: ${error.message}`);
        throw error;
      }
    }
    
    throw new Error(`WAF Stack deployment timeout after ${maxWaitTime / 1000 / 60} minutes`);
  }

  private async checkAndCleanupFailedStack(stackType: StackType, options: DeploymentOptions): Promise<void> {
    const stackName = getStackName(stackType, options.stage);
    
    try {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const regionOverride = stackType === 'waf' ? 'us-east-1' : undefined;
      const cfClient = regionOverride 
        ? new CloudFormationClient({ region: regionOverride, credentials: this.cfClient.config.credentials })
        : this.cfClient;
      
      const response = await cfClient.send(command);
      const stack = response.Stacks?.[0];
      const stackStatus = stack?.StackStatus;
      
      // Define failed states that require force deletion
      const failedStates = [
        'ROLLBACK_COMPLETE',
        'CREATE_FAILED', 
        'DELETE_FAILED',
        'UPDATE_ROLLBACK_FAILED',
        'UPDATE_ROLLBACK_COMPLETE'
      ];
      
      if (stackStatus && failedStates.includes(stackStatus)) {
        logger.warning(`Stack ${stackName} is in failed state: ${stackStatus}. Auto-cleaning with force deletion...`);
        
        const forceDeleteManager = new ForceDeleteManager(regionOverride || this.region);
        await forceDeleteManager.forceDeleteStack(stackType, {
          stage: options.stage,
          maxWaitMinutes: 20
        });
        
        logger.success(`Failed stack ${stackName} cleaned up successfully`);
      }
    } catch (error: any) {
      if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
        // Stack doesn't exist, which is fine
        logger.info(`Stack ${stackName} does not exist, proceeding with deployment`);
      } else {
        logger.warning(`Error checking stack status for cleanup: ${error.message}`);
        // Continue with deployment despite check failure
      }
    }
  }
}

// CLI Command definitions
async function main() {
  const deployment = new DeploymentManager();

  program
    .name('deploy')
    .description('CloudWatch Live Deployment Tool')
    .version('1.0.0');

  // Deploy specific package
  program
    .command('package')
    .description('Deploy a specific package')
    .option('--package <type>', 'Package to deploy (waf, shared, cwl)')
    .option('--stage <stage>', 'Deployment stage')
    .option('--admin-email <email>', 'Admin user email')
    .option('--auto-delete-failed', 'Auto delete failed stacks')
    .option('--skip-user-creation', 'Skip user creation')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        const packageName = options.package || await promptForPackage();
        
        // Prompt for stage if not provided
        const stage = options.stage || await promptForStage();
        
        const deploymentOptions: DeploymentOptions = {
          stage: stage,
          packageName,
          adminEmail: options.adminEmail,
          autoDeleteFailedStacks: options.autoDeleteFailed,
          skipUserCreation: options.skipUserCreation
        };

        await deployment.deployStack(packageName as StackType, deploymentOptions);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Deploy stack and its dependencies
  program
    .command('update')
    .description('Update a stack and redeploy dependent stacks')
    .option('--package <type>', 'Package to update (waf, shared, cwl)', 'shared')
    .option('--stage <stage>', 'Deployment stage')
    .option('--admin-email <email>', 'Admin user email')
    .option('--auto-delete-failed', 'Auto delete failed stacks')
    .option('--skip-user-creation', 'Skip user creation')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        // Prompt for stage if not provided
        const stage = options.stage || await promptForStage();
        
        const packageName = options.package as StackType;
        const deploymentOptions: DeploymentOptions = {
          stage: stage,
          packageName,
          adminEmail: options.adminEmail,
          autoDeleteFailedStacks: options.autoDeleteFailed,
          skipUserCreation: options.skipUserCreation
        };

        await deployment.updateStackWithDependencies(packageName, deploymentOptions);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Deploy all packages
  program
    .command('all')
    .description('Deploy all packages in order (waf -> shared -> cwl)')
    .option('--stage <stage>', 'Deployment stage')
    .option('--admin-email <email>', 'Admin user email')
    .option('--auto-delete-failed', 'Auto delete failed stacks')
    .option('--skip-user-creation', 'Skip user creation')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        // Prompt for stage if not provided
        const stage = options.stage || await promptForStage();
        
        const deploymentOptions: DeploymentOptions = {
          stage: stage,
          adminEmail: options.adminEmail,
          autoDeleteFailedStacks: options.autoDeleteFailed,
          skipUserCreation: options.skipUserCreation
        };

        await deployment.deployAll(deploymentOptions);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Remove a specific package
  program
    .command('remove')
    .description('Remove a specific package or all packages')
    .option('--package <type>', 'Package to remove (waf, shared, cwl)')
    .option('--stage <stage>', 'Deployment stage')
    .option('--all', 'Remove all stacks in the correct order')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        // Prompt for stage if not provided
        const stage = options.stage || await promptForStage();
        
        if (options.all) {
          const deploymentOptions: DeploymentOptions = {
            stage: stage
          };
          await deployment.removeAll(deploymentOptions);
        } else {
          const packageName = options.package || await promptForPackageToRemove();
          const deploymentOptions: DeploymentOptions = {
            stage: stage,
            packageName
          };
          
          if (packageName === 'all') {
            await deployment.removeAll(deploymentOptions);
          } else {
            await deployment.removeStack(packageName as StackType, deploymentOptions);
          }
        }
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Frontend deployment commands
  const frontend = program
    .command('frontend')
    .description('Frontend deployment commands');

  frontend
    .command('deploy')
    .description('Build, upload and invalidate frontend')
    .option('--stage <stage>', 'Deployment stage')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        // Prompt for stage if not provided
        const stage = options.stage || await promptForStage();
        
        await deployment.deployFrontend('deploy', stage);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  frontend
    .command('build')
    .description('Build frontend only')
    .option('--stage <stage>', 'Deployment stage')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        // Prompt for stage if not provided
        const stage = options.stage || await promptForStage();
        
        await deployment.deployFrontend('build', stage);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  frontend
    .command('upload')
    .description('Upload frontend to S3')
    .option('--stage <stage>', 'Deployment stage')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        // Prompt for stage if not provided
        const stage = options.stage || await promptForStage();
        
        await deployment.deployFrontend('upload', stage);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  frontend
    .command('invalidate')
    .description('Invalidate CloudFront cache')
    .option('--stage <stage>', 'Deployment stage')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        // Prompt for stage if not provided
        const stage = options.stage || await promptForStage();
        
        await deployment.deployFrontend('invalidate', stage);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Default command for backwards compatibility
  if (process.argv.length === 2) {
    await runInteractiveMode(deployment);
    return;
  }

  // Parse command line arguments
  await program.parseAsync(process.argv);
}

async function promptForPackage(): Promise<string> {
  const { package: packageName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'package',
      message: 'Which package would you like to deploy?',
      choices: [
        { name: 'WAF (Web Application Firewall)', value: 'waf' },
        { name: 'Shared Resources', value: 'shared' },
        { name: 'CloudWatch Live Application', value: 'cwl' },
        { name: 'All packages', value: 'all' }
      ]
    }
  ]);

  return packageName;
}

async function promptForStage(): Promise<string> {
  // This will be our default value
  const defaultStage = 'dev';
  
  let timeoutId: NodeJS.Timeout;
  let isTimedOut = false;
  
  // Create a promise that resolves after the timeout
  const timeoutPromise = new Promise<string>((resolve) => {
    timeoutId = setTimeout(() => {
      isTimedOut = true;
      // Clear current line and move cursor up to remove the inquirer prompt
      process.stdout.write('\r\x1B[K\x1B[1A\x1B[K');
      logger.info(`\nNo input received after 10 seconds, using default: ${defaultStage}`);
      resolve(defaultStage);
    }, 10000); // 10 seconds
  });
  
  // Create the inquirer prompt promise
  const promptPromise = inquirer.prompt([
    {
      type: 'list',
      name: 'stage',
      message: 'Select deployment stage:',
      choices: [
        { name: 'Development (dev)', value: 'dev' }
        // Add more environments when needed
        // { name: 'Production (prod)', value: 'prod' }
      ],
      default: 'dev'
    }
  ]).then(answers => {
    if (!isTimedOut) {
      clearTimeout(timeoutId);
      return answers.stage;
    }
    return defaultStage;
  });
  
  // Race the timeout against the prompt
  const stage = await Promise.race([timeoutPromise, promptPromise]);
  return stage;
}

async function promptForPackageToRemove(): Promise<string> {
  const { package: packageName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'package',
      message: 'Which package would you like to remove?',
      choices: [
        { name: 'CloudWatch Live Application', value: 'cwl' },
        { name: 'Shared Resources', value: 'shared' },
        { name: 'WAF (Web Application Firewall)', value: 'waf' },
        { name: 'All packages (in correct order)', value: 'all' }
      ]
    }
  ]);

  return packageName;
}

async function runInteractiveMode(deployment: DeploymentManager): Promise<void> {
  try {
    logger.info('CloudWatch Live Deployment Tool');
    logger.info('Running in interactive mode...');

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Deploy specific package', value: 'package' },
          { name: 'Deploy all packages', value: 'all' },
          { name: 'Remove packages', value: 'remove' },
          { name: 'Frontend deployment', value: 'frontend' }
        ]
      },
      {
        type: 'input',
        name: 'stage',
        message: 'Enter deployment stage:',
        default: 'dev'
      }
    ]);

    await deployment.initializeAws();

    if (answers.action === 'frontend') {
      const frontendAction = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Frontend action:',
          choices: [
            { name: 'Full deployment (build + upload + invalidate)', value: 'deploy' },
            { name: 'Build only', value: 'build' },
            { name: 'Upload only', value: 'upload' },
            { name: 'Invalidate cache only', value: 'invalidate' }
          ]
        }
      ]);

      await deployment.deployFrontend(frontendAction.action, answers.stage);
    } else if (answers.action === 'remove') {
      const packageName = await promptForPackageToRemove();
      const deploymentOptions: DeploymentOptions = {
        stage: answers.stage
      };
      
      if (packageName === 'all') {
        await deployment.removeAll(deploymentOptions);
      } else {
        await deployment.removeStack(packageName as StackType, deploymentOptions);
      }
    } else {
      const deploymentOptions: DeploymentOptions = {
        stage: answers.stage
      };

      if (answers.action === 'package') {
        const packageName = await promptForPackage();
        if (packageName === 'all') {
          await deployment.deployAll(deploymentOptions);
        } else {
          await deployment.deployStack(packageName as StackType, deploymentOptions);
        }
      } else {
        await deployment.deployAll(deploymentOptions);
      }
    }

    logger.success('Deployment completed successfully!');
  } catch (error: any) {
    logger.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}