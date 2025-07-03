import inquirer from 'inquirer';
import { exec } from 'child_process';
import { config } from 'dotenv';
import path from 'path';
import { ALLOWED_STAGES } from '../../shared/constants/stages';
import { logger } from './utils/logger';

// Load environment variables from mono-repo root
config({ path: path.resolve(__dirname, '../../../.env') });

function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = exec(command, (error, stdout, stderr) => {
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

async function deploymentMenu() {
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
    useSpot?: string;
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
          { name: 't3.micro - $0.75-7.50/month (Spot/On-Demand) - Basic coding', value: 't3.micro' },
          { name: 't3.small - $1.50-15.00/month (Spot/On-Demand) - Light development', value: 't3.small' },
          { name: 't3.medium - $3.00-30.00/month (Spot/On-Demand) - Full development', value: 't3.medium' }
        ],
        default: 't3.micro'
      }
    ]);

    const { useSpot } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useSpot',
        message: 'Use Spot instances? (Up to 90% cost savings, but can be interrupted)',
        default: true
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
      useSpot: useSpot.toString(),
      autoStop: autoStop.toString()
    };
  }

  const stackName = `ec2-vscode-server-${stage}`;

  if (action === 'deploy') {
    logger.info(`Deploying cost-optimized stack for stage: ${stage}`);
    if (costOptimizations.instanceType) {
      logger.info(`Instance: ${costOptimizations.instanceType}, Spot: ${costOptimizations.useSpot}, Auto-Stop: ${costOptimizations.autoStop}`);
      // Set environment variables for cost optimizations
      process.env.COST_OPT_USE_SPOT = costOptimizations.useSpot;
      process.env.COST_OPT_AUTO_STOP = costOptimizations.autoStop;
      process.env.COST_OPT_SPOT_MAX_PRICE = costOptimizations.useSpot === 'true' ? '0.0052' : '';
      
      const command = `DOTENV_CONFIG_PATH=../../../.env COST_OPT_USE_SPOT=${costOptimizations.useSpot} COST_OPT_AUTO_STOP=${costOptimizations.autoStop} COST_OPT_SPOT_MAX_PRICE=0.0052 ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key --instance-type ${costOptimizations.instanceType}`;
      await runCommand(command);
    } else {
      const command = `DOTENV_CONFIG_PATH=../../../.env ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key`;
      await runCommand(command);
    }
  } else if (action === 'update') {
    logger.info(`Updating existing stack for stage: ${stage} with cost optimizations`);
    if (costOptimizations.instanceType) {
      logger.info(`Instance: ${costOptimizations.instanceType}, Spot: ${costOptimizations.useSpot}, Auto-Stop: ${costOptimizations.autoStop}`);
      const command = `DOTENV_CONFIG_PATH=../../../.env COST_OPT_USE_SPOT=${costOptimizations.useSpot} COST_OPT_AUTO_STOP=${costOptimizations.autoStop} COST_OPT_SPOT_MAX_PRICE=0.0052 ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key --instance-type ${costOptimizations.instanceType}`;
      await runCommand(command);
    } else {
      const command = `DOTENV_CONFIG_PATH=../../../.env ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key`;
      await runCommand(command);
    }
  } else if (action === 'remove') {
    logger.info(`Removing stack for stage: ${stage}`);
    const command = `DOTENV_CONFIG_PATH=../../../.env ts-node -r dotenv/config src/index.ts remove --stack-name ${stackName} --force`;
    await runCommand(command);
  }
}

deploymentMenu().catch(error => {
    logger.error(`Menu failed: ${error.message}`);
    process.exit(1);
});
