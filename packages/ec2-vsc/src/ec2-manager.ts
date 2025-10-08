import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  Instance,
  InstanceState,
} from "@aws-sdk/client-ec2";
import {
  CloudFormationClient,
  DescribeStacksCommand,
  Stack,
} from "@aws-sdk/client-cloudformation";
import { logger } from "./utils/logger";
import ora from "ora";

export class EC2Manager {
  // Get stack outputs as a key-value map
  async getStackOutputs(
    stackName: string,
  ): Promise<Record<string, string> | undefined> {
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await this.cfnClient.send(command);
    const stack = response.Stacks?.[0];
    if (!stack?.Outputs) return undefined;
    const out: Record<string, string> = {};
    for (const o of stack.Outputs) out[o.OutputKey!] = o.OutputValue!;
    return out;
  }
  private ec2Client: EC2Client;
  private cfnClient: CloudFormationClient;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || "ap-southeast-2";
    this.ec2Client = new EC2Client({ region: this.region });
    this.cfnClient = new CloudFormationClient({ region: this.region });
  }

  async getStatus(stackName: string): Promise<void> {
    logger.info(`Getting status for stack: ${stackName}`);

    try {
      const instanceId = await this.getInstanceIdFromStack(stackName);
      if (!instanceId) {
        logger.warning("No EC2 instance found in the stack");
        return;
      }

      const instance = await this.getInstanceDetails(instanceId);
      if (!instance) {
        logger.warning("Instance not found");
        return;
      }

      this.displayInstanceStatus(instance);

      // Also display stack outputs if available
      await this.displayStackInfo(stackName);
    } catch (error: any) {
      logger.error(`Failed to get status: ${error.message}`);
      throw error;
    }
  }

  async startInstance(stackName: string): Promise<void> {
    logger.info(`Starting instance for stack: ${stackName}`);

    try {
      const instanceId = await this.getInstanceIdFromStack(stackName);
      if (!instanceId) {
        throw new Error("No EC2 instance found in the stack");
      }

      const instance = await this.getInstanceDetails(instanceId);
      if (!instance) {
        throw new Error("Instance not found");
      }

      const currentState = instance.State?.Name;
      if (currentState === "running") {
        logger.info("Instance is already running");
        this.displayInstanceStatus(instance);
        return;
      }

      if (currentState === "pending") {
        logger.info("Instance is already starting");
        await this.waitForInstanceState(instanceId, "running");
        return;
      }

      const spinner = ora("Starting EC2 instance...").start();

      const command = new StartInstancesCommand({
        InstanceIds: [instanceId],
      });

      await this.ec2Client.send(command);
      spinner.text = "Waiting for instance to start...";

      await this.waitForInstanceState(instanceId, "running");

      spinner.succeed("Instance started successfully!");

      // Get updated instance details
      const updatedInstance = await this.getInstanceDetails(instanceId);
      if (updatedInstance) {
        this.displayInstanceStatus(updatedInstance);
      }
    } catch (error: any) {
      logger.error(`Failed to start instance: ${error.message}`);
      throw error;
    }
  }

  async stopInstance(stackName: string): Promise<void> {
    logger.info(`Stopping instance for stack: ${stackName}`);

    try {
      const instanceId = await this.getInstanceIdFromStack(stackName);
      if (!instanceId) {
        throw new Error("No EC2 instance found in the stack");
      }

      const instance = await this.getInstanceDetails(instanceId);
      if (!instance) {
        throw new Error("Instance not found");
      }

      const currentState = instance.State?.Name;
      if (currentState === "stopped") {
        logger.info("Instance is already stopped");
        this.displayInstanceStatus(instance);
        return;
      }

      if (currentState === "stopping") {
        logger.info("Instance is already stopping");
        await this.waitForInstanceState(instanceId, "stopped");
        return;
      }

      const spinner = ora("Stopping EC2 instance...").start();

      const command = new StopInstancesCommand({
        InstanceIds: [instanceId],
      });

      await this.ec2Client.send(command);
      spinner.text = "Waiting for instance to stop...";

      await this.waitForInstanceState(instanceId, "stopped");

      spinner.succeed("Instance stopped successfully!");

      // Get updated instance details
      const updatedInstance = await this.getInstanceDetails(instanceId);
      if (updatedInstance) {
        this.displayInstanceStatus(updatedInstance);
      }
    } catch (error: any) {
      logger.error(`Failed to stop instance: ${error.message}`);
      throw error;
    }
  }

  async getConnectionInfo(stackName: string): Promise<void> {
    logger.info(`Getting connection information for stack: ${stackName}`);

    try {
      const instanceId = await this.getInstanceIdFromStack(stackName);
      if (!instanceId) {
        throw new Error("No EC2 instance found in the stack");
      }

      const instance = await this.getInstanceDetails(instanceId);
      if (!instance) {
        throw new Error("Instance not found");
      }

      const isRunning = instance.State?.Name === "running";

      logger.info("\\n🔗 Connection Information:");

      if (isRunning) {
        logger.success(`🟢 Status: Running`);
        if (instance.PublicIpAddress) {
          logger.success(
            `🌐 VSCode URL: http://${instance.PublicIpAddress}:8080`,
          );
          logger.info(`🌍 Public IP: ${instance.PublicIpAddress}`);
        }
        if (instance.PrivateIpAddress) {
          logger.info(`🏠 Private IP: ${instance.PrivateIpAddress}`);
        }
      } else {
        logger.warning(`🔴 Status: ${instance.State?.Name || "Unknown"}`);
        logger.info("Instance must be running to access VSCode server");
        logger.info("Run: yarn start to start the instance");
      }

      // Display additional stack information
      await this.displayStackInfo(stackName);
    } catch (error: any) {
      logger.error(`Failed to get connection info: ${error.message}`);
      throw error;
    }
  }

  private async getInstanceIdFromStack(
    stackName: string,
  ): Promise<string | undefined> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await this.cfnClient.send(command);
      const stack = response.Stacks?.[0];

      // Look for InstanceId in outputs
      const instanceOutput = stack?.Outputs?.find(
        (output) => output.OutputKey === "InstanceId",
      );
      return instanceOutput?.OutputValue;
    } catch (error: any) {
      if (error.name === "ValidationError") {
        throw new Error(`Stack '${stackName}' not found`);
      }
      throw error;
    }
  }

  private async getInstanceDetails(
    instanceId: string,
  ): Promise<Instance | undefined> {
    const command = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });

    const response = await this.ec2Client.send(command);
    return response.Reservations?.[0]?.Instances?.[0];
  }

  private displayInstanceStatus(instance: Instance): void {
    const state = instance.State?.Name || "Unknown";
    const stateReason = instance.StateReason?.Message || "";

    logger.info("\\n📊 Instance Status:");

    // Status with color coding
    if (state === "running") {
      logger.success(`🟢 Status: ${state}`);
    } else if (state === "stopped") {
      logger.warning(`🔴 Status: ${state}`);
    } else if (state === "pending") {
      logger.info(`🟡 Status: ${state}`);
    } else if (state === "stopping") {
      logger.info(`🟡 Status: ${state}`);
    } else {
      logger.warning(`⚪ Status: ${state}`);
    }

    if (stateReason) {
      logger.info(`   Reason: ${stateReason}`);
    }

    logger.info(`🆔 Instance ID: ${instance.InstanceId}`);
    logger.info(`🖥️  Instance Type: ${instance.InstanceType}`);

    if (instance.PublicIpAddress) {
      logger.info(`🌍 Public IP: ${instance.PublicIpAddress}`);
      if (state === "running") {
        logger.success(
          `🌐 VSCode URL: http://${instance.PublicIpAddress}:8080`,
        );
      }
    }

    if (instance.PrivateIpAddress) {
      logger.info(`🏠 Private IP: ${instance.PrivateIpAddress}`);
    }

    if (instance.KeyName) {
      logger.info(`🔑 Key Pair: ${instance.KeyName}`);
      if (instance.PublicIpAddress) {
        logger.info(
          `📡 SSH: ssh -i ~/.ssh/${instance.KeyName}.pem ec2-user@${instance.PublicIpAddress}`,
        );
      }
    }

    const launchTime = instance.LaunchTime;
    if (launchTime) {
      logger.info(`🚀 Launched: ${launchTime.toLocaleString()}`);
    }
  }

  private async displayStackInfo(stackName: string): Promise<void> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await this.cfnClient.send(command);
      const stack = response.Stacks?.[0];

      if (!stack?.Outputs) {
        return;
      }

      logger.info("\\n🗂️  Stack Information:");

      const backupBucket = stack.Outputs.find(
        (o) => o.OutputKey === "BackupBucket",
      );
      if (backupBucket?.OutputValue) {
        logger.info(`💾 Backup Bucket: ${backupBucket.OutputValue}`);
        logger.info("   • Daily automatic backups at 2 AM");
        logger.info("   • Manual backup: ~/backup-workspace.sh");
        logger.info("   • Restore: ~/restore-workspace.sh <filename>");
      }
    } catch (error: any) {
      // Silently ignore errors when getting stack info
    }
  }

  private async waitForInstanceState(
    instanceId: string,
    targetState: string,
  ): Promise<void> {
    const timeout = 10 * 60 * 1000; // 10 minutes
    const interval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const instance = await this.getInstanceDetails(instanceId);
      const currentState = instance?.State?.Name;

      if (currentState === targetState) {
        return;
      }

      if (currentState === "terminated" || currentState === "shutting-down") {
        throw new Error("Instance was terminated");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(
      `Timeout waiting for instance to reach state: ${targetState}`,
    );
  }
}
