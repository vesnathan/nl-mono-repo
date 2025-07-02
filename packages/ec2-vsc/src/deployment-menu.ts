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
      choices: ['deploy', 'remove'],
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

  const stackName = `ec2-vscode-server-${stage}`;

  if (action === 'deploy') {
    logger.info(`Deploying stack for stage: ${stage}`);
    const command = `DOTENV_CONFIG_PATH=../../.env ts-node -r dotenv/config src/index.ts deploy --stack-name ${stackName} --key-pair ${stackName}-key`;
    await runCommand(command);
  } else if (action === 'remove') {
    logger.info(`Removing stack for stage: ${stage}`);
    const command = `DOTENV_CONFIG_PATH=../../.env ts-node -r dotenv/config src/index.ts remove --stack-name ${stackName} --force`;
    await runCommand(command);
  }
}

deploymentMenu().catch(error => {
    logger.error(`Menu failed: ${error.message}`);
    process.exit(1);
});
