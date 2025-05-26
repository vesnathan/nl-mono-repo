import { Command } from 'commander';
import { DeploymentOptions, StackType } from './types';
import { logger } from './utils/logger';
import { configureAwsCredentials } from './utils/aws-credentials';
import { deployWaf } from './packages/waf/waf';
import { deployShared } from './packages/shared/shared';
import { deployCwl } from './packages/cwl/cwl';

async function main() {
  // Add uncaught exception handlers for debugging
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
  });

  const program = new Command();

  program
    .name('deploy')
    .description('Deploy CloudWatch Live infrastructure')
    .option('-s, --stage <stage>', 'Deployment stage (dev, staging, prod)', 'dev')
    .option('-p, --package <package>', 'Deploy specific package (waf, shared, cwl)')
    .option('--no-auto-delete', 'Disable auto-deletion of failed stacks')
    .option('--aws-region <region>', 'AWS Region', 'ap-southeast-2')
    .parse(process.argv);

  const options = program.opts();
  
  // Set default region
  process.env.AWS_REGION = options.awsRegion;
  
  // Configure AWS credentials interactively if not set
  await configureAwsCredentials();

  const deploymentOptions: DeploymentOptions = {
    stage: options.stage,
    autoDeleteFailedStacks: options.autoDelete !== false,
    packageName: options.package
  };

  try {
    if (options.package) {
      // Deploy single package
      await deploySinglePackage(options.package as StackType, deploymentOptions);
    } else {
      // Deploy all packages in order
      await deployAll(deploymentOptions);
    }
  } catch (error) {
    logger.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function deploySinglePackage(packageName: StackType, options: DeploymentOptions) {
  switch (packageName) {
    case 'waf':
      await deployWaf(options);
      break;
    case 'shared':
      await deployShared(options);
      break;
    case 'cwl':
      await deployCwl(options);
      break;
    default:
      throw new Error(`Unknown package: ${packageName}`);
  }
}

async function deployAll(options: DeploymentOptions) {
  logger.info('Starting full deployment...');

  // Deploy in order: WAF -> Shared -> CWL
  await deployWaf(options);
  await deployShared(options);
  await deployCwl(options);

  logger.success('Full deployment completed successfully');
}

main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
