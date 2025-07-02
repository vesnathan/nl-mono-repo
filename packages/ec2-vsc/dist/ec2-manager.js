"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EC2Manager = void 0;
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const logger_1 = require("./utils/logger");
const ora_1 = __importDefault(require("ora"));
class EC2Manager {
    constructor() {
        this.ec2Client = new client_ec2_1.EC2Client({ region: 'ap-southeast-2' });
        this.cfnClient = new client_cloudformation_1.CloudFormationClient({ region: 'ap-southeast-2' });
    }
    async getStatus(stackName) {
        logger_1.logger.info(`Getting status for stack: ${stackName}`);
        try {
            const instanceId = await this.getInstanceIdFromStack(stackName);
            if (!instanceId) {
                logger_1.logger.warning('No EC2 instance found in the stack');
                return;
            }
            const instance = await this.getInstanceDetails(instanceId);
            if (!instance) {
                logger_1.logger.warning('Instance not found');
                return;
            }
            this.displayInstanceStatus(instance);
            // Also display stack outputs if available
            await this.displayStackInfo(stackName);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get status: ${error.message}`);
            throw error;
        }
    }
    async startInstance(stackName) {
        logger_1.logger.info(`Starting instance for stack: ${stackName}`);
        try {
            const instanceId = await this.getInstanceIdFromStack(stackName);
            if (!instanceId) {
                throw new Error('No EC2 instance found in the stack');
            }
            const instance = await this.getInstanceDetails(instanceId);
            if (!instance) {
                throw new Error('Instance not found');
            }
            const currentState = instance.State?.Name;
            if (currentState === 'running') {
                logger_1.logger.info('Instance is already running');
                this.displayInstanceStatus(instance);
                return;
            }
            if (currentState === 'pending') {
                logger_1.logger.info('Instance is already starting');
                await this.waitForInstanceState(instanceId, 'running');
                return;
            }
            const spinner = (0, ora_1.default)('Starting EC2 instance...').start();
            const command = new client_ec2_1.StartInstancesCommand({
                InstanceIds: [instanceId]
            });
            await this.ec2Client.send(command);
            spinner.text = 'Waiting for instance to start...';
            await this.waitForInstanceState(instanceId, 'running');
            spinner.succeed('Instance started successfully!');
            // Get updated instance details
            const updatedInstance = await this.getInstanceDetails(instanceId);
            if (updatedInstance) {
                this.displayInstanceStatus(updatedInstance);
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to start instance: ${error.message}`);
            throw error;
        }
    }
    async stopInstance(stackName) {
        logger_1.logger.info(`Stopping instance for stack: ${stackName}`);
        try {
            const instanceId = await this.getInstanceIdFromStack(stackName);
            if (!instanceId) {
                throw new Error('No EC2 instance found in the stack');
            }
            const instance = await this.getInstanceDetails(instanceId);
            if (!instance) {
                throw new Error('Instance not found');
            }
            const currentState = instance.State?.Name;
            if (currentState === 'stopped') {
                logger_1.logger.info('Instance is already stopped');
                this.displayInstanceStatus(instance);
                return;
            }
            if (currentState === 'stopping') {
                logger_1.logger.info('Instance is already stopping');
                await this.waitForInstanceState(instanceId, 'stopped');
                return;
            }
            const spinner = (0, ora_1.default)('Stopping EC2 instance...').start();
            const command = new client_ec2_1.StopInstancesCommand({
                InstanceIds: [instanceId]
            });
            await this.ec2Client.send(command);
            spinner.text = 'Waiting for instance to stop...';
            await this.waitForInstanceState(instanceId, 'stopped');
            spinner.succeed('Instance stopped successfully!');
            // Get updated instance details
            const updatedInstance = await this.getInstanceDetails(instanceId);
            if (updatedInstance) {
                this.displayInstanceStatus(updatedInstance);
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to stop instance: ${error.message}`);
            throw error;
        }
    }
    async getConnectionInfo(stackName) {
        logger_1.logger.info(`Getting connection information for stack: ${stackName}`);
        try {
            const instanceId = await this.getInstanceIdFromStack(stackName);
            if (!instanceId) {
                throw new Error('No EC2 instance found in the stack');
            }
            const instance = await this.getInstanceDetails(instanceId);
            if (!instance) {
                throw new Error('Instance not found');
            }
            const isRunning = instance.State?.Name === 'running';
            logger_1.logger.info('\\n🔗 Connection Information:');
            if (isRunning) {
                logger_1.logger.success(`🟢 Status: Running`);
                if (instance.PublicIpAddress) {
                    logger_1.logger.success(`🌐 VSCode URL: http://${instance.PublicIpAddress}:8080`);
                    logger_1.logger.info(`🌍 Public IP: ${instance.PublicIpAddress}`);
                }
                if (instance.PrivateIpAddress) {
                    logger_1.logger.info(`🏠 Private IP: ${instance.PrivateIpAddress}`);
                }
            }
            else {
                logger_1.logger.warning(`🔴 Status: ${instance.State?.Name || 'Unknown'}`);
                logger_1.logger.info('Instance must be running to access VSCode server');
                logger_1.logger.info('Run: yarn start to start the instance');
            }
            // Display additional stack information
            await this.displayStackInfo(stackName);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get connection info: ${error.message}`);
            throw error;
        }
    }
    async getInstanceIdFromStack(stackName) {
        try {
            const command = new client_cloudformation_1.DescribeStacksCommand({
                StackName: stackName
            });
            const response = await this.cfnClient.send(command);
            const stack = response.Stacks?.[0];
            // Look for InstanceId in outputs
            const instanceOutput = stack?.Outputs?.find(output => output.OutputKey === 'InstanceId');
            return instanceOutput?.OutputValue;
        }
        catch (error) {
            if (error.name === 'ValidationError') {
                throw new Error(`Stack '${stackName}' not found`);
            }
            throw error;
        }
    }
    async getInstanceDetails(instanceId) {
        const command = new client_ec2_1.DescribeInstancesCommand({
            InstanceIds: [instanceId]
        });
        const response = await this.ec2Client.send(command);
        return response.Reservations?.[0]?.Instances?.[0];
    }
    displayInstanceStatus(instance) {
        const state = instance.State?.Name || 'Unknown';
        const stateReason = instance.StateReason?.Message || '';
        logger_1.logger.info('\\n📊 Instance Status:');
        // Status with color coding
        if (state === 'running') {
            logger_1.logger.success(`🟢 Status: ${state}`);
        }
        else if (state === 'stopped') {
            logger_1.logger.warning(`🔴 Status: ${state}`);
        }
        else if (state === 'pending') {
            logger_1.logger.info(`🟡 Status: ${state}`);
        }
        else if (state === 'stopping') {
            logger_1.logger.info(`🟡 Status: ${state}`);
        }
        else {
            logger_1.logger.warning(`⚪ Status: ${state}`);
        }
        if (stateReason) {
            logger_1.logger.info(`   Reason: ${stateReason}`);
        }
        logger_1.logger.info(`🆔 Instance ID: ${instance.InstanceId}`);
        logger_1.logger.info(`🖥️  Instance Type: ${instance.InstanceType}`);
        if (instance.PublicIpAddress) {
            logger_1.logger.info(`🌍 Public IP: ${instance.PublicIpAddress}`);
            if (state === 'running') {
                logger_1.logger.success(`🌐 VSCode URL: http://${instance.PublicIpAddress}:8080`);
            }
        }
        if (instance.PrivateIpAddress) {
            logger_1.logger.info(`🏠 Private IP: ${instance.PrivateIpAddress}`);
        }
        if (instance.KeyName) {
            logger_1.logger.info(`🔑 Key Pair: ${instance.KeyName}`);
            if (instance.PublicIpAddress) {
                logger_1.logger.info(`📡 SSH: ssh -i ~/.ssh/${instance.KeyName}.pem ec2-user@${instance.PublicIpAddress}`);
            }
        }
        const launchTime = instance.LaunchTime;
        if (launchTime) {
            logger_1.logger.info(`🚀 Launched: ${launchTime.toLocaleString()}`);
        }
    }
    async displayStackInfo(stackName) {
        try {
            const command = new client_cloudformation_1.DescribeStacksCommand({
                StackName: stackName
            });
            const response = await this.cfnClient.send(command);
            const stack = response.Stacks?.[0];
            if (!stack?.Outputs) {
                return;
            }
            logger_1.logger.info('\\n🗂️  Stack Information:');
            const backupBucket = stack.Outputs.find(o => o.OutputKey === 'BackupBucket');
            if (backupBucket?.OutputValue) {
                logger_1.logger.info(`💾 Backup Bucket: ${backupBucket.OutputValue}`);
                logger_1.logger.info('   • Daily automatic backups at 2 AM');
                logger_1.logger.info('   • Manual backup: ~/backup-workspace.sh');
                logger_1.logger.info('   • Restore: ~/restore-workspace.sh <filename>');
            }
        }
        catch (error) {
            // Silently ignore errors when getting stack info
        }
    }
    async waitForInstanceState(instanceId, targetState) {
        const timeout = 10 * 60 * 1000; // 10 minutes
        const interval = 5000; // 5 seconds
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const instance = await this.getInstanceDetails(instanceId);
            const currentState = instance?.State?.Name;
            if (currentState === targetState) {
                return;
            }
            if (currentState === 'terminated' || currentState === 'shutting-down') {
                throw new Error('Instance was terminated');
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error(`Timeout waiting for instance to reach state: ${targetState}`);
    }
}
exports.EC2Manager = EC2Manager;
