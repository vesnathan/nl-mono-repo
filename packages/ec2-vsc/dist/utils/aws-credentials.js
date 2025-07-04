"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureAwsCredentials = exports.getAwsCredentials = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const logger_1 = require("./logger");
const fs_1 = require("fs");
const path_1 = require("path");
async function getAwsCredentials() {
    await configureAwsCredentials();
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        return {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        };
    }
    return undefined;
}
exports.getAwsCredentials = getAwsCredentials;
async function configureAwsCredentials() {
    // First, try to load credentials from the deploy package
    await loadCredentialsFromDeployPackage();
    // Only ask for credentials if they're not already set or fail validation
    const validateExistingCredentials = async () => {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_ACCOUNT_ID) {
            return false;
        }
        try {
            const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
            const stsClient = new STSClient({ region: 'us-east-1' });
            await stsClient.send(new GetCallerIdentityCommand({}));
            logger_1.logger.success('Existing AWS credentials validated successfully');
            return true;
        }
        catch (error) {
            logger_1.logger.warning(`Existing credentials failed validation: ${error.message}`);
            return false;
        }
    };
    const isValid = await validateExistingCredentials();
    if (!isValid) {
        logger_1.logger.info('Please enter your AWS credentials:');
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'accessKeyId',
                message: 'AWS Access Key ID:',
                validate: (input) => {
                    return input.length > 0 ? true : 'Access Key ID cannot be empty';
                }
            },
            {
                type: 'password',
                name: 'secretAccessKey',
                message: 'AWS Secret Access Key:',
                mask: '*',
                validate: (input) => {
                    return input.length > 0 ? true : 'Secret Access Key cannot be empty';
                }
            },
            {
                type: 'input',
                name: 'accountId',
                message: 'AWS Account ID:',
                validate: (input) => {
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
            const deployPackageEnvPath = (0, path_1.join)(__dirname, '../../../../deploy/.env');
            const envContent = `AWS_ACCESS_KEY_ID=${answers.accessKeyId}
AWS_SECRET_ACCESS_KEY=${answers.secretAccessKey}
AWS_ACCOUNT_ID=${answers.accountId}`;
            (0, fs_1.writeFileSync)(deployPackageEnvPath, envContent);
            logger_1.logger.success('AWS credentials saved to deploy package .env file');
            // Also save to local .env file for this package
            const localEnvPath = (0, path_1.join)(process.cwd(), '.env');
            (0, fs_1.writeFileSync)(localEnvPath, envContent);
            logger_1.logger.success('AWS credentials saved locally');
        }
        catch (error) {
            logger_1.logger.warning('Could not save credentials to .env file. They will only persist for this session.');
        }
        // Validate the new credentials
        try {
            const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
            const stsClient = new STSClient({ region: 'us-east-1' });
            await stsClient.send(new GetCallerIdentityCommand({}));
            logger_1.logger.success('AWS credentials configured and validated successfully');
        }
        catch (error) {
            logger_1.logger.error(`Failed to validate AWS credentials: ${error.message}`);
            throw error;
        }
    }
}
exports.configureAwsCredentials = configureAwsCredentials;
async function loadCredentialsFromDeployPackage() {
    try {
        // Try to load from deploy package .env file
        const deployPackageEnvPath = (0, path_1.join)(__dirname, '../../../../deploy/.env');
        if ((0, fs_1.existsSync)(deployPackageEnvPath)) {
            logger_1.logger.info('Loading AWS credentials from deploy package...');
            // Load the .env file from deploy package
            const dotenv = require('dotenv');
            const result = dotenv.config({ path: deployPackageEnvPath });
            if (!result.error) {
                logger_1.logger.success('AWS credentials loaded from deploy package');
                return;
            }
        }
        // Try to load from workspace root .env file
        const rootEnvPath = (0, path_1.join)(__dirname, '../../../../../.env');
        if ((0, fs_1.existsSync)(rootEnvPath)) {
            logger_1.logger.info('Loading AWS credentials from workspace root...');
            const dotenv = require('dotenv');
            const result = dotenv.config({ path: rootEnvPath });
            if (!result.error) {
                logger_1.logger.success('AWS credentials loaded from workspace root');
                return;
            }
        }
        // Try to use existing environment variables (might be set by other means)
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_ACCOUNT_ID) {
            logger_1.logger.info('Using existing AWS credentials from environment');
            return;
        }
        logger_1.logger.debug('No existing AWS credentials found, will prompt for new credentials');
    }
    catch (error) {
        logger_1.logger.debug(`Failed to load existing credentials: ${error.message}`);
    }
}
