"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentManager = void 0;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const logger_1 = require("./utils/logger");
const fs_1 = require("fs");
const path_1 = require("path");
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
class DeploymentManager {
    constructor() {
        this.cfnClient = new client_cloudformation_1.CloudFormationClient({ region: 'ap-southeast-2' });
    }
    async deploy(options) {
        logger_1.logger.info(`Deploying VSCode server with stack name: ${options.stackName}`);
        // Check if stack already exists
        const stackExists = await this.stackExists(options.stackName);
        if (stackExists) {
            logger_1.logger.warning(`Stack ${options.stackName} already exists.`);
            const { update } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'update',
                    message: 'Do you want to update the existing stack?',
                    default: false
                }
            ]);
            if (!update) {
                logger_1.logger.info('Deployment cancelled.');
                return;
            }
        }
        // Get VSCode password
        const { password } = await inquirer_1.default.prompt([
            {
                type: 'password',
                name: 'password',
                message: 'Enter password for VSCode server access:',
                mask: '*',
                validate: (input) => {
                    if (input.length < 8) {
                        return 'Password must be at least 8 characters long';
                    }
                    return true;
                }
            }
        ]);
        // Load CloudFormation template
        const templatePath = (0, path_1.join)(__dirname, '..', 'cfn-template.yaml');
        const template = (0, fs_1.readFileSync)(templatePath, 'utf8');
        // Prepare parameters
        const parameters = [
            { ParameterKey: 'InstanceType', ParameterValue: options.instanceType },
            { ParameterKey: 'AllowedIPs', ParameterValue: options.allowedIPs },
            { ParameterKey: 'VSCodePassword', ParameterValue: password },
            { ParameterKey: 'VolumeSize', ParameterValue: options.volumeSize },
        ];
        if (options.keyPair) {
            parameters.push({ ParameterKey: 'KeyPairName', ParameterValue: options.keyPair });
        }
        // Deploy stack
        const spinner = (0, ora_1.default)('Deploying CloudFormation stack...').start();
        try {
            const command = new client_cloudformation_1.CreateStackCommand({
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
        }
        catch (error) {
            spinner.fail('Stack deployment failed');
            throw error;
        }
    }
    async remove(stackName) {
        logger_1.logger.info(`Removing stack: ${stackName}`);
        const stackExists = await this.stackExists(stackName);
        if (!stackExists) {
            logger_1.logger.warning(`Stack ${stackName} does not exist.`);
            return;
        }
        const spinner = (0, ora_1.default)('Deleting CloudFormation stack...').start();
        try {
            const command = new client_cloudformation_1.DeleteStackCommand({
                StackName: stackName
            });
            await this.cfnClient.send(command);
            spinner.text = 'Stack deletion initiated, waiting for completion...';
            // Wait for stack deletion to complete
            await this.waitForStackDeletion(stackName, spinner);
            spinner.succeed('Stack deleted successfully!');
        }
        catch (error) {
            spinner.fail('Stack deletion failed');
            throw error;
        }
    }
    async stackExists(stackName) {
        try {
            const command = new client_cloudformation_1.DescribeStacksCommand({
                StackName: stackName
            });
            const response = await this.cfnClient.send(command);
            return !!(response.Stacks && response.Stacks.length > 0);
        }
        catch (error) {
            if (error.name === 'ValidationError') {
                return false;
            }
            throw error;
        }
    }
    async waitForStackCompletion(stackName, spinner) {
        const timeout = 30 * 60 * 1000; // 30 minutes
        const interval = 15000; // 15 seconds
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const command = new client_cloudformation_1.DescribeStacksCommand({
                    StackName: stackName
                });
                const response = await this.cfnClient.send(command);
                const stack = response.Stacks?.[0];
                if (!stack) {
                    throw new Error('Stack not found');
                }
                const status = stack.StackStatus;
                spinner.text = `Stack status: ${status}`;
                if (status === client_cloudformation_1.StackStatus.CREATE_COMPLETE || status === client_cloudformation_1.StackStatus.UPDATE_COMPLETE) {
                    return;
                }
                if (status === client_cloudformation_1.StackStatus.CREATE_FAILED ||
                    status === client_cloudformation_1.StackStatus.UPDATE_FAILED ||
                    status === client_cloudformation_1.StackStatus.ROLLBACK_COMPLETE ||
                    status === client_cloudformation_1.StackStatus.UPDATE_ROLLBACK_COMPLETE) {
                    throw new Error(`Stack deployment failed with status: ${status}`);
                }
                await new Promise(resolve => setTimeout(resolve, interval));
            }
            catch (error) {
                if (error.message.includes('Stack deployment failed')) {
                    throw error;
                }
                // Continue waiting for other errors
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        throw new Error('Stack deployment timeout');
    }
    async waitForStackDeletion(stackName, spinner) {
        const timeout = 20 * 60 * 1000; // 20 minutes
        const interval = 10000; // 10 seconds
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const command = new client_cloudformation_1.DescribeStacksCommand({
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
                if (status === client_cloudformation_1.StackStatus.DELETE_FAILED) {
                    throw new Error(`Stack deletion failed with status: ${status}`);
                }
                await new Promise(resolve => setTimeout(resolve, interval));
            }
            catch (error) {
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
    async displayStackOutputs(stackName) {
        try {
            const command = new client_cloudformation_1.DescribeStacksCommand({
                StackName: stackName
            });
            const response = await this.cfnClient.send(command);
            const stack = response.Stacks?.[0];
            if (!stack?.Outputs) {
                logger_1.logger.warning('No stack outputs available');
                return;
            }
            logger_1.logger.info('\\n🎉 VSCode Server deployed successfully!');
            logger_1.logger.info('\\n📋 Connection Information:');
            for (const output of stack.Outputs) {
                const key = output.OutputKey;
                const value = output.OutputValue;
                const description = output.Description;
                if (key === 'VSCodeURL') {
                    logger_1.logger.success(`🌐 VSCode URL: ${value}`);
                }
                else if (key === 'PublicIP') {
                    logger_1.logger.info(`🌍 Public IP: ${value}`);
                }
                else if (key === 'SSHCommand') {
                    logger_1.logger.info(`🔑 SSH Command: ${value}`);
                }
                else if (key === 'BackupBucket') {
                    logger_1.logger.info(`💾 Backup Bucket: ${value}`);
                }
                else {
                    logger_1.logger.info(`${key}: ${value}`);
                }
            }
            logger_1.logger.info('\\n💡 Usage Tips:');
            logger_1.logger.info('• Access your VSCode server using the URL above');
            logger_1.logger.info('• Use the password you set during deployment');
            logger_1.logger.info('• Your workspace will be automatically backed up daily');
            logger_1.logger.info('• Run backup manually: ~/backup-workspace.sh');
            logger_1.logger.info('• Restore workspace: ~/restore-workspace.sh <backup-filename>');
            logger_1.logger.info('• Manage instance: yarn start/stop/status');
        }
        catch (error) {
            logger_1.logger.error(`Failed to get stack outputs: ${error.message}`);
        }
    }
}
exports.DeploymentManager = DeploymentManager;
