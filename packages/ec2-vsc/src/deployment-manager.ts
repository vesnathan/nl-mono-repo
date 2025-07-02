import { 
  CloudFormationClient, 
  CreateStackCommand, 
  DeleteStackCommand, 
  DescribeStacksCommand, 
  DescribeStackEventsCommand,
  StackStatus,
  Parameter,
  Stack
} from '@aws-sdk/client-cloudformation';
import { logger } from './utils/logger';
import { readFileSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import { v4 as uuidv4 } from 'uuid';
import inquirer from 'inquirer';

export interface DeploymentOptions {
  instanceType: string;
  keyPair?: string;
  allowedIps: string;
  volumeSize: string;
  stackName: string;
}

export class DeploymentManager {
  private cfnClient: CloudFormationClient;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-southeast-2';
    this.cfnClient = new CloudFormationClient({ region: this.region });
  }

  async deploy(options: DeploymentOptions): Promise<void> {
    logger.info(`Deploying VSCode server with stack name: ${options.stackName}`);

    // Check if stack already exists
    let stackExists = await this.stackExists(options.stackName);
    if (stackExists) {
      logger.warning(`Stack ${options.stackName} already exists.`);
      const { update } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'update',
          message: 'Do you want to update the existing stack?',
          default: false
        }
      ]);

      if (!update) {
        const { remove } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'remove',
            message: 'Do you want to delete the existing stack and redeploy?',
            default: false
          }
        ]);
        if (!remove) {
          logger.info('Deployment cancelled.');
          return;
        }
        // Delete the stack and wait for deletion
        await this.remove(options.stackName);
        // Wait for stack to be fully deleted before proceeding
        logger.info('Waiting for stack to be fully deleted before redeploying...');
        let deleted = false;
        for (let i = 0; i < 60; i++) { // up to 10 minutes
          stackExists = await this.stackExists(options.stackName);
          if (!stackExists) {
            deleted = true;
            break;
          }
          await new Promise(res => setTimeout(res, 10000));
        }
        if (!deleted) {
          logger.error('Timed out waiting for stack deletion. Please check the AWS Console.');
          return;
        }
        logger.success('Stack deleted. Proceeding with fresh deployment.');
      }
    }


    // Load CloudFormation template
    const templatePath = join(__dirname, '..', 'cfn-template.yaml');
    const template = readFileSync(templatePath, 'utf8');

    // Prepare parameters
    const parameters: Parameter[] = [
      { ParameterKey: 'InstanceType', ParameterValue: options.instanceType },
    ];

    if (options.keyPair) {
      parameters.push({ ParameterKey: 'KeyPairName', ParameterValue: options.keyPair });
    }

    // Deploy stack
    const spinner = ora('Deploying CloudFormation stack...').start();

    try {
      const command = new CreateStackCommand({
        StackName: options.stackName,
        TemplateBody: template,
        Parameters: parameters,
        Capabilities: ['CAPABILITY_IAM'],
        Tags: [
          { Key: 'Project', Value: 'EC2-VSCode-Server' },
          { Key: 'DeployedBy', Value: 'ec2-vsc-cli' },
          { Key: 'CreatedAt', Value: new Date().toISOString() }
        ]
      });

      await this.cfnClient.send(command);
      spinner.text = 'Stack deployment initiated, waiting for completion...';

      // Wait for stack to complete
      await this.waitForStackCompletion(options.stackName, spinner);
      
      spinner.succeed('Stack deployed successfully!');

      // Get stack outputs
      await this.displayStackOutputs(options.stackName);

    } catch (error: any) {
      spinner.fail('Stack deployment failed');
      logger.error(error?.message || error);
      await this.printStackFailureReasons(options.stackName);
      throw error;
    }
  }

  /**
   * Print CloudFormation stack failure reasons for the given stack
   */
  private async printStackFailureReasons(stackName: string): Promise<void> {
    try {
      const command = new DescribeStackEventsCommand({ StackName: stackName });
      const response = await this.cfnClient.send(command);
      const failedEvents = response.StackEvents?.filter(event =>
        event.ResourceStatus && event.ResourceStatus.includes('FAILED')
      );
      if (failedEvents && failedEvents.length > 0) {
        logger.error('\nCloudFormation failure details:');
        for (const event of failedEvents) {
          logger.error(`  Resource: ${event.LogicalResourceId} (${event.ResourceType})`);
          logger.error(`  Reason: ${event.ResourceStatusReason}`);
        }
      } else {
        logger.error('No CloudFormation failure events found. Check the AWS Console for more details.');
      }
    } catch (err: any) {
      logger.error('Could not fetch stack failure details: ' + (err?.message || err));
    }
  }

  async remove(stackName: string): Promise<void> {
    logger.info(`Removing stack: ${stackName}`);

    const stackExists = await this.stackExists(stackName);
    if (!stackExists) {
      logger.warning(`Stack ${stackName} does not exist.`);
      return;
    }

    const spinner = ora('Deleting CloudFormation stack...').start();

    try {
      const command = new DeleteStackCommand({
        StackName: stackName
      });

      await this.cfnClient.send(command);
      spinner.text = 'Stack deletion initiated, waiting for completion...';

      // Wait for stack deletion to complete
      await this.waitForStackDeletion(stackName, spinner);
      
      spinner.succeed('Stack deleted successfully!');

    } catch (error: any) {
      spinner.fail('Stack deletion failed');
      throw error;
    }
  }

  private async stackExists(stackName: string): Promise<boolean> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName
      });

      const response = await this.cfnClient.send(command);
      return !!(response.Stacks && response.Stacks.length > 0);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return false;
      }
      throw error;
    }
  }

  private async waitForStackCompletion(stackName: string, spinner: ora.Ora): Promise<void> {
    const timeout = 30 * 60 * 1000; // 30 minutes
    const interval = 15000; // 15 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const command = new DescribeStacksCommand({
          StackName: stackName
        });

        const response = await this.cfnClient.send(command);
        const stack = response.Stacks?.[0];

        if (!stack) {
          throw new Error('Stack not found');
        }

        const status = stack.StackStatus;
        spinner.text = `Stack status: ${status}`;

        if (status === StackStatus.CREATE_COMPLETE || status === StackStatus.UPDATE_COMPLETE) {
          return;
        }

        if (status === StackStatus.CREATE_FAILED || 
            status === StackStatus.UPDATE_FAILED ||
            status === StackStatus.ROLLBACK_COMPLETE ||
            status === StackStatus.UPDATE_ROLLBACK_COMPLETE) {
          throw new Error(`Stack deployment failed with status: ${status}`);
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error: any) {
        if (error.message.includes('Stack deployment failed')) {
          throw error;
        }
        // Continue waiting for other errors
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Stack deployment timeout');
  }

  private async waitForStackDeletion(stackName: string, spinner: ora.Ora): Promise<void> {
    const timeout = 20 * 60 * 1000; // 20 minutes
    const interval = 10000; // 10 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const command = new DescribeStacksCommand({
          StackName: stackName
        });

        const response = await this.cfnClient.send(command);
        const stack = response.Stacks?.[0];

        if (!stack) {
          // Stack no longer exists - deletion complete
          return;
        }

        const status = stack.StackStatus;
        spinner.text = `Stack status: ${status}`;

        if (status === StackStatus.DELETE_FAILED) {
          throw new Error(`Stack deletion failed with status: ${status}`);
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
          // Stack successfully deleted
          return;
        }
        
        if (error.message.includes('Stack deletion failed')) {
          throw error;
        }
        
        // Continue waiting for other errors
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Stack deletion timeout');
  }

  private async displayStackOutputs(stackName: string): Promise<void> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName
      });

      const response = await this.cfnClient.send(command);
      const stack = response.Stacks?.[0];

      if (!stack?.Outputs) {
        logger.warning('No stack outputs available');
        return;
      }

      logger.info('\\n🎉 VSCode Server deployed successfully!');
      logger.info('\\n⏳ Waiting for instance and services to be ready...');
      
      // Wait for instance to be ready and VSCode server to be accessible
      await this.waitForInstanceReady(stack);
      
      logger.info('\\n📋 Connection Information:');
      
      for (const output of stack.Outputs) {
        const key = output.OutputKey;
        const value = output.OutputValue;
        const description = output.Description;

        if (key === 'VSCodeURL') {
          logger.success(`🌐 VSCode URL: ${value}`);
        } else if (key === 'PublicIP') {
          logger.info(`🌍 Public IP: ${value}`);
        } else if (key === 'SSHCommand') {
          logger.info(`🔑 SSH Command: ${value}`);
        } else if (key === 'BackupBucket') {
          logger.info(`💾 Backup Bucket: ${value}`);
        } else {
          logger.info(`${key}: ${value}`);
        }
      }

      logger.info('\\n💡 Usage Tips:');
      logger.info('• Access your VSCode server using the URL above');
      logger.info('• Your workspace will be automatically backed up daily');
      logger.info('• Run backup manually: ~/backup-workspace.sh');
      logger.info('• Restore workspace: ~/restore-workspace.sh <backup-filename>');
      logger.info('• Manage instance: yarn start/stop/status');

    } catch (error: any) {
      logger.error(`Failed to get stack outputs: ${error.message}`);
    }
  }

  private async waitForInstanceReady(stack: Stack): Promise<void> {
    try {
      // Get instance ID and VSCode URL from stack outputs
      const instanceId = stack.Outputs?.find(o => o.OutputKey === 'InstanceId')?.OutputValue;
      const vscodeUrl = stack.Outputs?.find(o => o.OutputKey === 'VSCodeURL')?.OutputValue;
      
      if (!instanceId) {
        logger.warning('Instance ID not found in stack outputs');
        return;
      }

      // Wait for EC2 instance to be running
      logger.info('⏳ Waiting for EC2 instance to be running...');
      const { EC2Client, DescribeInstancesCommand } = await import('@aws-sdk/client-ec2');
      const ec2Client = new EC2Client({ region: this.region });
      
      let instanceRunning = false;
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (!instanceRunning && attempts < maxAttempts) {
        const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
        const response = await ec2Client.send(command);
        const instance = response.Reservations?.[0]?.Instances?.[0];
        
        if (instance?.State?.Name === 'running') {
          instanceRunning = true;
          logger.success('✅ EC2 instance is running');
        } else {
          logger.info(`Instance state: ${instance?.State?.Name || 'unknown'}`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          attempts++;
        }
      }
      
      if (!instanceRunning) {
        logger.warning('⚠️ Instance did not reach running state within 5 minutes');
        return;
      }

      // Wait for VSCode server to be accessible
      if (vscodeUrl) {
        logger.info('⏳ Waiting for VSCode server to be accessible...');
        let vscodeReady = false;
        attempts = 0;
        const maxVscodeAttempts = 60; // 10 minutes max for VSCode setup
        
        while (!vscodeReady && attempts < maxVscodeAttempts) {
          try {
            // Use curl to check if VSCode server is responding
            const { execSync } = await import('child_process');
            execSync(`curl -s --max-time 5 --head "${vscodeUrl}" > /dev/null`, { stdio: 'ignore' });
            vscodeReady = true;
            logger.success('✅ VSCode server is accessible');
          } catch (error) {
            logger.info(`VSCode server not ready yet (attempt ${attempts + 1}/${maxVscodeAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            attempts++;
          }
        }
        
        if (!vscodeReady) {
          logger.warning('⚠️ VSCode server did not become accessible within 10 minutes');
          logger.info('The instance may still be installing VSCode server. Check the install log later.');
        }
      }
      
    } catch (error: any) {
      logger.warning(`Error checking instance readiness: ${error.message}`);
    }
  }
}
