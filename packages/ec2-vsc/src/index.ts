import inquirer from 'inquirer';
import open from 'open';
import { existsSync, writeFileSync, unlinkSync, chmodSync } from 'fs';

import { program } from 'commander';
import { logger } from './utils/logger';
import { DeploymentManager } from './deployment-manager';
import { EC2Manager } from './ec2-manager';
import { configureAwsCredentials } from './utils/aws-credentials';
import { execSync, spawn } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';
import { 
  EC2Client, 
  CreateKeyPairCommand, 
  DeleteKeyPairCommand,
  DescribeKeyPairsCommand 
} from '@aws-sdk/client-ec2';

// Load environment variables from mono-repo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function main() {
  async function ensureKeyPair(keyName: string) {
    const keyFile = `${keyName}.pem`;
    const region = process.env.AWS_REGION || 'ap-southeast-2';
    const ec2Client = new EC2Client({ region });
    
    // Always delete existing key pair from AWS first (whether local file exists or not)
    logger.info(`Checking for existing key pair ${keyName} in AWS...`);
    try {
      const describeCommand = new DescribeKeyPairsCommand({ KeyNames: [keyName] });
      await ec2Client.send(describeCommand);
      
      logger.info(`Key pair ${keyName} exists in AWS, deleting it...`);
      const deleteCommand = new DeleteKeyPairCommand({ KeyName: keyName });
      await ec2Client.send(deleteCommand);
      logger.info(`Old key pair ${keyName} deleted from AWS.`);
    } catch (e: any) {
      if (e.name === 'InvalidKeyPair.NotFound') {
        logger.debug(`Key pair ${keyName} does not exist in AWS - ready to create new one.`);
      } else {
        logger.warning(`Could not check/delete existing key pair: ${e.message}`);
      }
    }
    
    // Delete local key file if it exists
    if (existsSync(keyFile)) {
      logger.info(`Deleting existing local key file ${keyFile}...`);
      unlinkSync(keyFile);
    }
    
    // Create new key pair
    logger.info(`Creating new key pair ${keyName} in region ${region}...`);
    try {
      const createCommand = new CreateKeyPairCommand({ KeyName: keyName });
      const response = await ec2Client.send(createCommand);
      
      if (response.KeyMaterial) {
        writeFileSync(keyFile, response.KeyMaterial);
        chmodSync(keyFile, 0o400);
        logger.success(`Key pair ${keyName} created and saved to ${keyFile}`);
      } else {
        throw new Error('No key material returned from AWS');
      }
    } catch (e: any) {
      logger.error(`Failed to create key pair: ${e.message}`);
      logger.error('Please check your AWS credentials and permissions.');
      process.exit(1);
    }
  }
  program
    .command('menu')
    .description('Interactive menu for EC2 VSCode server')
    .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
    .action(async (options) => {
      await configureAwsCredentials();
      const ec2Manager = new EC2Manager();
      const stackName = options.stackName;
      // Get stack outputs
      const outputs = await ec2Manager.getStackOutputs(stackName);
      if (!outputs) {
        logger.error('No stack outputs found. Is the stack deployed?');
        process.exit(1);
      }
      const publicIp = outputs.PublicIP;
      const vscodeUrl = outputs.VSCodeURL;
      const keyName = outputs.KeyPairName || 'ec2-vsc-key';
      const keyFile = `${keyName}.pem`;
      const sshCmd = `ssh -i ${keyFile} ec2-user@${publicIp}`;

      const keyExists = existsSync(keyFile);
      if (!keyExists) {
        logger.warning(`Key file '${keyFile}' not found. SSH will be disabled.`);
        logger.warning('Run `yarn deploy` to create the key file.');
      }

      const choices = [
        { name: `SSH into instance (${publicIp})`, value: 'ssh', disabled: !keyExists ? 'Key file not found' : false },
        { name: `Open VSCode server in browser (${vscodeUrl})`, value: 'vscode' },
        { name: 'Tail code-server install log', value: 'log' },
        { name: 'Check instance status', value: 'check-status' },
        { name: 'Show connection info', value: 'info' },
        { name: 'Exit', value: 'exit' }
      ];
      while (true) {
        const answers = await inquirer.prompt([
          { type: 'list', name: 'action', message: 'Select an action:', choices }
        ]);
        const action = answers.action;
        if (action === 'ssh') {
          if (!keyExists) {
            logger.error(`Cannot SSH: Key file \'${keyFile}\' not found.`);
          } else {
            logger.info('Connecting to instance via SSH...');
            logger.info(`If connection hangs, check: 1) Security Group allows SSH from your IP, 2) Instance is running`);
            
            // Add connection timeout and verbose SSH options
            const sshCmdWithOptions = `ssh -i ${keyFile} -o ConnectTimeout=30 -o StrictHostKeyChecking=no -v ec2-user@${publicIp}`;
            const sshParts = sshCmdWithOptions.split(' ');
            const command = sshParts[0];
            const args = sshParts.slice(1);
            
            const sshProcess = spawn(command, args, { stdio: 'inherit' });
            
            // Set a timeout for the SSH connection
            const timeout = setTimeout(() => {
              logger.warning('SSH connection is taking longer than expected...');
              logger.info('You can press Ctrl+C to cancel and check:');
              logger.info('1. Security Group allows SSH (port 22) from your IP');
              logger.info('2. Instance is in "running" state');
              logger.info('3. Instance has finished initialization');
            }, 10000); // 10 seconds
            
            await new Promise((resolve) => {
              sshProcess.on('close', () => {
                clearTimeout(timeout);
                resolve(undefined);
              });
            });
          }
        } else if (action === 'vscode') {
          logger.info(`Opening VSCode server: ${vscodeUrl}`);
          await open(vscodeUrl);
        } else if (action === 'log') {
          logger.info('To view the install log, run:');
          logger.info(`ssh -i ${keyFile} -o ConnectTimeout=30 -o StrictHostKeyChecking=no ec2-user@${publicIp} 'tail -n 50 /var/log/code-server-install.log'`);
        } else if (action === 'check-status') {
          logger.info('Checking instance status...');
          try {
            const instanceId = outputs.InstanceId;
            if (instanceId) {
              const { EC2Client, DescribeInstancesCommand } = await import('@aws-sdk/client-ec2');
            const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });
              const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
              const response = await ec2Client.send(command);
              const instance = response.Reservations?.[0]?.Instances?.[0];
              if (instance) {
                logger.info(`Instance State: ${instance.State?.Name}`);
                logger.info(`Instance Status: ${instance.StateReason?.Message || 'N/A'}`);
                logger.info(`Public IP: ${instance.PublicIpAddress || 'N/A'}`);
              } else {
                logger.warning('Instance not found');
              }
            } else {
              logger.warning('Instance ID not found in stack outputs');
            }
          } catch (error: any) {
            logger.error(`Failed to check instance status: ${error.message}`);
          }
        } else if (action === 'info') {
          logger.info(`Public IP: ${publicIp}`);
          logger.info(`VSCode URL: ${vscodeUrl}`);
          logger.info(`SSH: ${sshCmd}`);
        } else {
          break;
        }
      }
    });
// Helper to get stack outputs in EC2Manager
// Add this method to EC2Manager:
// async getStackOutputs(stackName: string): Promise<Record<string, string> | undefined> {
//   const command = new DescribeStacksCommand({ StackName: stackName });
//   const response = await this.cfnClient.send(command);
//   const stack = response.Stacks?.[0];
//   if (!stack?.Outputs) return undefined;
//   const out: Record<string, string> = {};
//   for (const o of stack.Outputs) out[o.OutputKey!] = o.OutputValue!;
//   return out;
// }
  program
    .name('ec2-vsc')
    .description('EC2 VSCode Server - Deploy and manage VSCode Server on EC2')
    .version('1.0.0');

  program
    .command('deploy')
    .description('Deploy the VSCode server to EC2')
    .option('-t, --instance-type <type>', 'EC2 instance type', 't3.medium')
    .option('-k, --key-pair <name>', 'EC2 Key Pair name for SSH access', 'ec2-vsc-key')
    .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
    .action(async (options) => {
      try {
        logger.info('Starting EC2 VSCode Server deployment...');
        await configureAwsCredentials();
        await ensureKeyPair(options.keyPair);
        const deploymentManager = new DeploymentManager();
        await deploymentManager.deploy(options);
        logger.success('Deployment completed successfully! ✨');
      } catch (error: any) {
        logger.error(`Deployment failed: ${error.message}`);
        process.exit(1);
      }
    });

  program
  // (Removed duplicate menu command and stray closing brace)

  program
    .command('connect')
    .description('Get connection information for the VSCode server')
    .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
    .action(async (options) => {
      try {
        await configureAwsCredentials();
        
        const ec2Manager = new EC2Manager();
        await ec2Manager.getConnectionInfo(options.stackName);
      } catch (error: any) {
        logger.error(`Failed to get connection info: ${error.message}`);
        process.exit(1);
      }
    });

  program
    .command('remove')
    .description('Remove the VSCode server and all resources')
    .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
    .option('-f, --force', 'Force removal without confirmation')
    .action(async (options) => {
      try {
        logger.warning('This will permanently delete all resources and data!');
        
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to remove the VSCode server?',
              default: false
            }
          ]);
          if (!answers.confirm) {
            logger.info('Removal cancelled.');
            return;
          }
        }

        await configureAwsCredentials();
        
        const deploymentManager = new DeploymentManager();
        await deploymentManager.remove(options.stackName);
        
        logger.success('Resources removed successfully!');
      } catch (error: any) {
        logger.error(`Failed to remove resources: ${error.message}`);
        process.exit(1);
      }
    });

  program
    .command('delete')
    .description('Delete the CloudFormation stack for the VSCode server')
    .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (options) => {
      try {
        logger.warning('This will permanently delete the CloudFormation stack and all associated resources!');
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to delete the CloudFormation stack?',
              default: false
            }
          ]);
          if (!answers.confirm) {
            logger.info('Stack deletion cancelled.');
            return;
          }
        }

        await configureAwsCredentials();
        const { CloudFormationClient, DeleteStackCommand } = await import('@aws-sdk/client-cloudformation');
        const stackName = options.stackName;
        const cfnClient = new CloudFormationClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
        logger.info(`Deleting CloudFormation stack: ${stackName}`);
        await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
        logger.success('DeleteStack command sent. Monitoring stack deletion...');

        // Wait for stack deletion to complete
        const { DescribeStacksCommand } = await import('@aws-sdk/client-cloudformation');
        let stackDeleted = false;
        const pollInterval = 5000; // 5 seconds
        while (!stackDeleted) {
          try {
            await new Promise(res => setTimeout(res, pollInterval));
            const resp = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
            const stack = resp.Stacks?.[0];
            if (!stack) {
              stackDeleted = true;
              break;
            }
            logger.info(`Stack status: ${stack.StackStatus}`);
            if (stack.StackStatus === 'DELETE_COMPLETE') {
              stackDeleted = true;
              break;
            } else if (stack.StackStatus && stack.StackStatus.endsWith('FAILED')) {
              logger.error(`Stack deletion failed with status: ${stack.StackStatus}`);
              process.exit(1);
            }
          } catch (err: any) {
            // If stack is not found, it is deleted
            if (err.name === 'ValidationError' && err.message.includes('does not exist')) {
              stackDeleted = true;
              break;
            }
            logger.info('Waiting for stack to be deleted...');
          }
        }
        logger.success('Stack deletion complete.');
      } catch (error: any) {
        logger.error(`Failed to delete stack: ${error.message}`);
        process.exit(1);
      }
    });

  program.parse();
}

if (require.main === module) {
  main().catch((error) => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}
