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
  private region: string;

  constructor(region = 'ap-southeast-2') {
    this.region = region;
    this.cfClient = new CloudFormationClient({ region });
    this.frontendManager = new FrontendDeploymentManager(region);
    this.userManager = new UserSetupManager(region);
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
    const stackName = getStackName(stackType, stage);
    const bucketName = getTemplateBucketName(stackType, stage);

    try {
      logger.info(`Starting deployment of ${stackType} stack for stage: ${stage}`);

      // Create templates bucket and upload resources
      await this.awsUtils.createTemplatesBucket(bucketName, this.region, stackType);

      // Get template body
      const templateBody = await getTemplateBody(stackType);

      // Check if stack exists
      const stackExists = await this.stackExists(stackName);

      const parameters = await this.getStackParameters(stackType, stage, options);

      if (stackExists) {
        logger.info(`Updating existing stack: ${stackName}`);
        await this.updateStack(stackName, templateBody, parameters);
      } else {
        logger.info(`Creating new stack: ${stackName}`);
        await this.createStack(stackName, templateBody, parameters);
      }

      await this.waitForStackCompletion(stackName);
      logger.success(`Successfully deployed ${stackType} stack: ${stackName}`);

      // Post-deployment tasks
      await this.postDeploymentTasks(stackType, options);

    } catch (error: any) {
      logger.error(`Failed to deploy ${stackType} stack: ${error.message}`);
      
      if (options.autoDeleteFailedStacks) {
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
    if (stackType === 'cwl' && !options.skipUserCreation && options.adminEmail) {
      logger.info('Setting up admin user...');
      try {
        await this.userManager.createAdminUser({
          stage: options.stage,
          adminEmail: options.adminEmail,
          region: this.region
        });
        logger.success('Admin user setup completed');
      } catch (error: any) {
        logger.warning(`Admin user setup failed: ${error.message}`);
      }
    }
  }

  private async handleFailedStack(stackName: string): Promise<void> {
    try {
      logger.info(`Attempting to delete failed stack: ${stackName}`);
      const command = new DeleteStackCommand({ StackName: stackName });
      await this.cfClient.send(command);
      
      // Wait for deletion to complete
      await this.waitForStackDeletion(stackName);
      logger.success(`Failed stack deleted: ${stackName}`);
    } catch (error: any) {
      logger.error(`Failed to delete failed stack: ${error.message}`);
    }
  }

  private async waitForStackDeletion(stackName: string): Promise<void> {
    const maxWaitTime = 20 * 60 * 1000; // 20 minutes
    const pollInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await this.cfClient.send(command);
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
    const stacks: StackType[] = ['waf', 'shared', 'cwl'];
    
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
    
    try {
      const command = new DeleteStackCommand({ StackName: stackName });
      await this.cfClient.send(command);
      
      // Wait for deletion to complete
      await this.waitForStackDeletion(stackName);
      logger.success(`Stack deleted successfully: ${stackName}`);
    } catch (error: any) {
      logger.error(`Failed to delete stack ${stackName}: ${error.message}`);
      throw error;
    }
  }

  async removeAll(options: DeploymentOptions): Promise<void> {
    // Remove stacks in reverse order of deployment
    const stacks: StackType[] = ['cwl', 'shared', 'waf'];
    
    for (const stackType of stacks) {
      await this.removeStack(stackType, options);
    }
    
    logger.success('All stacks removed successfully!');
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
    .option('--stage <stage>', 'Deployment stage', 'dev')
    .option('--admin-email <email>', 'Admin user email')
    .option('--auto-delete-failed', 'Auto delete failed stacks')
    .option('--skip-user-creation', 'Skip user creation')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        const packageName = options.package || await promptForPackage();
        const deploymentOptions: DeploymentOptions = {
          stage: options.stage,
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
    .option('--stage <stage>', 'Deployment stage', 'dev')
    .option('--admin-email <email>', 'Admin user email')
    .option('--auto-delete-failed', 'Auto delete failed stacks')
    .option('--skip-user-creation', 'Skip user creation')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        const packageName = options.package as StackType;
        const deploymentOptions: DeploymentOptions = {
          stage: options.stage,
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
    .option('--stage <stage>', 'Deployment stage', 'dev')
    .option('--admin-email <email>', 'Admin user email')
    .option('--auto-delete-failed', 'Auto delete failed stacks')
    .option('--skip-user-creation', 'Skip user creation')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        const deploymentOptions: DeploymentOptions = {
          stage: options.stage,
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
    .option('--stage <stage>', 'Deployment stage', 'dev')
    .option('--all', 'Remove all stacks in the correct order')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        
        if (options.all) {
          const deploymentOptions: DeploymentOptions = {
            stage: options.stage
          };
          await deployment.removeAll(deploymentOptions);
        } else {
          const packageName = options.package || await promptForPackageToRemove();
          const deploymentOptions: DeploymentOptions = {
            stage: options.stage,
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
    .option('--stage <stage>', 'Deployment stage', 'dev')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        await deployment.deployFrontend('deploy', options.stage);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  frontend
    .command('build')
    .description('Build frontend only')
    .option('--stage <stage>', 'Deployment stage', 'dev')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        await deployment.deployFrontend('build', options.stage);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  frontend
    .command('upload')
    .description('Upload frontend to S3')
    .option('--stage <stage>', 'Deployment stage', 'dev')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        await deployment.deployFrontend('upload', options.stage);
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  frontend
    .command('invalidate')
    .description('Invalidate CloudFront cache')
    .option('--stage <stage>', 'Deployment stage', 'dev')
    .action(async (options) => {
      try {
        await deployment.initializeAws();
        await deployment.deployFrontend('invalidate', options.stage);
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