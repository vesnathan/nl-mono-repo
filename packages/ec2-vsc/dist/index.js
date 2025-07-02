#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const logger_1 = require("./utils/logger");
const deployment_manager_1 = require("./deployment-manager");
const ec2_manager_1 = require("./ec2-manager");
const aws_credentials_1 = require("./utils/aws-credentials");
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
async function main() {
    commander_1.program
        .name('ec2-vsc')
        .description('EC2 VSCode Server - Deploy and manage VSCode Server on EC2')
        .version('1.0.0');
    commander_1.program
        .command('deploy')
        .description('Deploy the VSCode server to EC2')
        .option('-t, --instance-type <type>', 'EC2 instance type', 't3.medium')
        .option('-k, --key-pair <name>', 'EC2 Key Pair name for SSH access')
        .option('-i, --allowed-ips <cidr>', 'CIDR block for allowed IPs', '0.0.0.0/0')
        .option('-s, --volume-size <size>', 'EBS volume size in GB', '20')
        .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
        .action(async (options) => {
        try {
            logger_1.logger.info('Starting EC2 VSCode Server deployment...');
            await (0, aws_credentials_1.configureAwsCredentials)();
            const deploymentManager = new deployment_manager_1.DeploymentManager();
            await deploymentManager.deploy(options);
            logger_1.logger.success('Deployment completed successfully! ✨');
        }
        catch (error) {
            logger_1.logger.error(`Deployment failed: ${error.message}`);
            process.exit(1);
        }
    });
    commander_1.program
        .command('status')
        .description('Get status of the VSCode server')
        .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
        .action(async (options) => {
        try {
            await (0, aws_credentials_1.configureAwsCredentials)();
            const ec2Manager = new ec2_manager_1.EC2Manager();
            await ec2Manager.getStatus(options.stackName);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get status: ${error.message}`);
            process.exit(1);
        }
    });
    commander_1.program
        .command('start')
        .description('Start the VSCode server instance')
        .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
        .action(async (options) => {
        try {
            await (0, aws_credentials_1.configureAwsCredentials)();
            const ec2Manager = new ec2_manager_1.EC2Manager();
            await ec2Manager.startInstance(options.stackName);
            logger_1.logger.success('Instance started successfully!');
        }
        catch (error) {
            logger_1.logger.error(`Failed to start instance: ${error.message}`);
            process.exit(1);
        }
    });
    commander_1.program
        .command('stop')
        .description('Stop the VSCode server instance')
        .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
        .action(async (options) => {
        try {
            await (0, aws_credentials_1.configureAwsCredentials)();
            const ec2Manager = new ec2_manager_1.EC2Manager();
            await ec2Manager.stopInstance(options.stackName);
            logger_1.logger.success('Instance stopped successfully!');
        }
        catch (error) {
            logger_1.logger.error(`Failed to stop instance: ${error.message}`);
            process.exit(1);
        }
    });
    commander_1.program
        .command('connect')
        .description('Get connection information for the VSCode server')
        .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
        .action(async (options) => {
        try {
            await (0, aws_credentials_1.configureAwsCredentials)();
            const ec2Manager = new ec2_manager_1.EC2Manager();
            await ec2Manager.getConnectionInfo(options.stackName);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get connection info: ${error.message}`);
            process.exit(1);
        }
    });
    commander_1.program
        .command('remove')
        .description('Remove the VSCode server and all resources')
        .option('-n, --stack-name <name>', 'CloudFormation stack name', 'ec2-vscode-server')
        .option('-f, --force', 'Force removal without confirmation')
        .action(async (options) => {
        try {
            logger_1.logger.warning('This will permanently delete all resources and data!');
            if (!options.force) {
                const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
                const { confirm } = await inquirer.default.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: 'Are you sure you want to remove the VSCode server?',
                        default: false
                    }
                ]);
                if (!confirm) {
                    logger_1.logger.info('Removal cancelled.');
                    return;
                }
            }
            await (0, aws_credentials_1.configureAwsCredentials)();
            const deploymentManager = new deployment_manager_1.DeploymentManager();
            await deploymentManager.remove(options.stackName);
            logger_1.logger.success('Resources removed successfully!');
        }
        catch (error) {
            logger_1.logger.error(`Failed to remove resources: ${error.message}`);
            process.exit(1);
        }
    });
    commander_1.program.parse();
}
if (require.main === module) {
    main().catch((error) => {
        logger_1.logger.error(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}
