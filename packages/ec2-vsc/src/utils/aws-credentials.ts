import inquirer from 'inquirer';
import { logger } from './logger';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { AwsCredentialIdentity } from '@aws-sdk/types';

export async function getAwsCredentials(): Promise<AwsCredentialIdentity | undefined> {
  await configureAwsCredentials();
  
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }
  
  return undefined;
}

export async function configureAwsCredentials(): Promise<void> {
  // Set SSL bypass for development environments
  if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    logger.info('🔧 SSL verification disabled for development environment');
  }

  logger.info('Using existing AWS credentials from environment');

  // First, try to load credentials from the deploy package
  await loadCredentialsFromDeployPackage();
  
  // Only ask for credentials if they're not already set or fail validation
  const validateExistingCredentials = async (): Promise<boolean> => {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_ACCOUNT_ID) {
      logger.debug('Missing required AWS credentials in environment');
      return false;
    }

    // Skip validation if explicitly disabled for development
    if (process.env.SKIP_AWS_VALIDATION === 'true') {
      logger.info('AWS credential validation skipped (SKIP_AWS_VALIDATION=true)');
      return true;
    }

    try {
      const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
      const stsClient = new STSClient({ 
        region: process.env.AWS_REGION || 'ap-southeast-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      
      const result = await stsClient.send(new GetCallerIdentityCommand({}));
      logger.success(`AWS credentials validated successfully for account: ${result.Account}`);
      return true;
    } catch (error: any) {
      logger.warning(`AWS credential validation failed: ${error.message}`);
      return false;
    }
  };

  const isValid = await validateExistingCredentials();
  if (!isValid) {
    logger.error('Current AWS credentials are invalid or expired. Please enter new credentials:');
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'accessKeyId',
        message: 'AWS Access Key ID:',
        validate: (input: string) => {
          return input.length > 0 ? true : 'Access Key ID cannot be empty';
        }
      },
      {
        type: 'password',
        name: 'secretAccessKey',
        message: 'AWS Secret Access Key:',
        mask: '*',
        validate: (input: string) => {
          return input.length > 0 ? true : 'Secret Access Key cannot be empty';
        }
      },
      {
        type: 'input',
        name: 'accountId',
        message: 'AWS Account ID:',
        validate: (input: string) => {
          return /^\d{12}$/.test(input) ? true : 'Account ID must be 12 digits';
        }
      }
    ]);

    // Set the credentials in environment variables
    process.env.AWS_ACCESS_KEY_ID = answers.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = answers.secretAccessKey;
    process.env.AWS_ACCOUNT_ID = answers.accountId;

    // Save credentials to the deploy package .env file (shared across packages)
    try {
      const deployPackageEnvPath = join(__dirname, '../../../../deploy/.env');
      const rootEnvPath = join(__dirname, '../../../../.env');
      const envContent = `AWS_ACCESS_KEY_ID=${answers.accessKeyId}
AWS_SECRET_ACCESS_KEY=${answers.secretAccessKey}
AWS_ACCOUNT_ID=${answers.accountId}`;
      
      // First try to save to workspace root .env (where we load from)
      try {
        writeFileSync(rootEnvPath, envContent);
        logger.success('AWS credentials saved to workspace root .env file');
      } catch (rootErr: any) {
        logger.warning(`Could not save credentials to root .env: ${rootErr.message}`);
      }
      
      // Also try deploy package if it exists
      try {
        writeFileSync(deployPackageEnvPath, envContent);
        logger.success('AWS credentials saved to deploy package .env file');
      } catch (deployErr: any) {
        logger.warning(`Could not save credentials to deploy/.env: ${deployErr.message}`);
        if (deployErr.code === 'ENOENT') {
          logger.warning('The directory for deploy/.env does not exist. Please create the deploy package or its .env file manually.');
        }
      }
    } catch (error) {
      logger.warning('Could not save credentials to any .env file. They will only persist for this session.');
    }
    
    // Validate the new credentials
    try {
      const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
      const stsClient = new STSClient({ 
        region: process.env.AWS_REGION || 'ap-southeast-2'
      });
      await stsClient.send(new GetCallerIdentityCommand({}));
      logger.success('AWS credentials configured and validated successfully');
    } catch (error: any) {
      logger.error(`Failed to validate AWS credentials: ${error.message}`);
      throw error;
    }
  }
}

async function loadCredentialsFromDeployPackage(): Promise<void> {
  try {
    // Try to load from deploy package .env file
    const deployPackageEnvPath = join(__dirname, '../../../../deploy/.env');
    
    if (existsSync(deployPackageEnvPath)) {
      logger.info('Loading AWS credentials from deploy package...');
      
      // Load the .env file from deploy package
      const dotenv = require('dotenv');
      const result = dotenv.config({ path: deployPackageEnvPath });
      
      if (!result.error) {
        logger.success('AWS credentials loaded from deploy package');
        return;
      }
    }
    
    // Try to load from workspace root .env file
    const rootEnvPath = join(__dirname, '../../../../.env');
    if (existsSync(rootEnvPath)) {
      logger.info('Loading AWS credentials from workspace root...');
      
      const dotenv = require('dotenv');
      const result = dotenv.config({ path: rootEnvPath });
      
      if (!result.error) {
        logger.success('AWS credentials loaded from workspace root');
        return;
      }
    }
    
    // Try to use existing environment variables (might be set by other means)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_ACCOUNT_ID) {
      logger.info('Using existing AWS credentials from environment');
      return;
    }
    
    logger.debug('No existing AWS credentials found, will prompt for new credentials');
    
  } catch (error: any) {
    logger.debug(`Failed to load existing credentials: ${error.message}`);
  }
}
