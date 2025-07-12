import inquirer from 'inquirer';
import { exec } from 'child_process';
import { config } from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { ALLOWED_STAGES } from '../../shared/constants/stages';
import { logger } from './utils/logger';

// Load environment variables from mono-repo root
config({ path: path.resolve(__dirname, '../../../.env') });

function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Add SSL bypass for development environments
    const env = {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    };
    
    const child = exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        logger.error(stderr);
        reject(error);
        return;
      }
      logger.info(stdout);
      resolve();
    });

    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
  });
}

async function checkAndLoadAwsCredentials(): Promise<void> {
  // Check if AWS credentials are already set
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    logger.info('✅ AWS credentials already loaded');
    return;
  }

  logger.info('🔑 AWS credentials not found, attempting to load from .env file...');
  
  // Check if .env file exists
  const envPath = path.resolve(__dirname, '../../../.env');
  if (!existsSync(envPath)) {
    throw new Error(`❌ .env file not found at ${envPath}. Please create a .env file in the mono-repo root with AWS credentials or run 'cd ../deploy && yarn deploy' to set up credentials.`);
  }

  // Re-load environment variables to ensure we have the latest
  config({ path: envPath, override: true });

  // Verify credentials are now loaded
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(`❌ AWS credentials not found in .env file. The .env file should contain AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY`);
  }

  // Set default region if not specified
  if (!process.env.AWS_REGION) {
    process.env.AWS_REGION = 'ap-southeast-2';
  }

  // Handle SSL verification issues in development environments
  if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    logger.info('🔧 SSL verification disabled for development environment');
  }

  logger.info('✅ AWS credentials loaded successfully');
  logger.info(`🌍 Region: ${process.env.AWS_REGION}`);
  logger.info(`🔑 Access Key: ${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
}

async function deploymentMenu() {
  try {
    // Check and load AWS credentials first
    await checkAndLoadAwsCredentials();
  } catch (error: any) {
    logger.error(error.message);
    process.exit(1);
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: ['deploy', 'update', 'remove'],
    },
  ]);

  const { stage } = await inquirer.prompt([
    {
      type: 'list',
      name: 'stage',
      message: 'Which stage?',
      choices: ALLOWED_STAGES,
    },
  ]);

  let costOptimizations: {
    instanceType?: string;
    autoStop?: string;
  } = {};
  
  if (action === 'deploy' || action === 'update') {
    // Cost optimization prompts
    const { instanceType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'instanceType',
        message: 'Choose instance type (cost/performance):',
        choices: [
          { name: 't3.micro - ~$7.50/month - Basic coding', value: 't3.micro' },
          { name: 't3.small - ~$15.00/month - Light development', value: 't3.small' },
          { name: 't3.medium - ~$30.00/month - Full development', value: 't3.medium' }
        ],
        default: 't3.micro'
      }
    ]);

    const { autoStop } = await inquirer.prompt([
      {
        type: 'confirm', 
        name: 'autoStop',
        message: 'Enable auto-stop after 2 hours of inactivity? (Saves costs)',
        default: true
      }
    ]);

    costOptimizations = {
      instanceType,
      autoStop: autoStop.toString()
    };
  }

  const stackName = `ec2-vscode-server-${stage}`;

  if (action === 'deploy') {
    logger.info(`Deploying cost-optimized stack for stage: ${stage}`);
    if (costOptimizations.instanceType) {
      logger.info(`Instance: ${costOptimizations.instanceType}, Auto-Stop: ${costOptimizations.autoStop}, HTTPS: always enabled`);
      // Set environment variables for cost optimizations
      process.env.COST_OPT_AUTO_STOP = costOptimizations.autoStop;
      
      const command = `NODE_TLS_REJECT_UNAUTHORIZED=0 DOTENV_CONFIG_PATH=../../../.env COST_OPT_AUTO_STOP=${costOptimizations.autoStop} ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key --instance-type ${costOptimizations.instanceType}`;
      await runCommand(command);
    } else {
      const command = `NODE_TLS_REJECT_UNAUTHORIZED=0 DOTENV_CONFIG_PATH=../../../.env ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key`;
      await runCommand(command);
    }
  } else if (action === 'update') {
    logger.info(`Updating existing stack for stage: ${stage} with cost optimizations`);
    if (costOptimizations.instanceType) {
      logger.info(`Instance: ${costOptimizations.instanceType}, Auto-Stop: ${costOptimizations.autoStop}, HTTPS: always enabled`);
      const command = `NODE_TLS_REJECT_UNAUTHORIZED=0 DOTENV_CONFIG_PATH=../../../.env COST_OPT_AUTO_STOP=${costOptimizations.autoStop} ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key --instance-type ${costOptimizations.instanceType}`;
      await runCommand(command);
    } else {
      const command = `NODE_TLS_REJECT_UNAUTHORIZED=0 DOTENV_CONFIG_PATH=../../../.env ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key`;
      await runCommand(command);
    }
  } else if (action === 'remove') {
    logger.info(`Removing stack for stage: ${stage}`);
    const command = `NODE_TLS_REJECT_UNAUTHORIZED=0 DOTENV_CONFIG_PATH=../../../.env ts-node -r dotenv/config src/index.ts remove --stack-name ${stackName} --force`;
    await runCommand(command);
    logger.info('\n🗑️ Stack removal completed!');
  }
}

deploymentMenu().catch(error => {
    logger.error(`Menu failed: ${error.message}`);
    process.exit(1);
});
