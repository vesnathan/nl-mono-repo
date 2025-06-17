import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { logger } from './utils/logger';
import { StackType, getStackName } from './types';

export interface StackOutput {
  OutputKey: string;
  OutputValue: string;
  Description?: string;
  ExportName?: string;
}

export interface DeploymentOutputs {
  stage: string;
  lastUpdated: string;
  stacks: {
    waf?: {
      region: string;
      stackName: string;
      outputs: StackOutput[];
    };
    shared?: {
      region: string;
      stackName: string;
      outputs: StackOutput[];
    };
    cwl?: {
      region: string;
      stackName: string;
      outputs: StackOutput[];
    };
  };
}

export class OutputsManager {
  private outputsFilePath: string;

  constructor() {
    this.outputsFilePath = join(__dirname, 'deployment-outputs.json');
  }

  async saveStackOutputs(stackType: StackType, stage: string, region: string): Promise<void> {
    try {
      const stackName = getStackName(stackType, stage);
      
      // Use the correct region for each stack type
      const stackRegion = stackType === 'waf' ? 'us-east-1' : region;
      const cfClient = new CloudFormationClient({ region: stackRegion });
      
      logger.info(`Fetching outputs for ${stackType} stack: ${stackName} in region ${stackRegion}`);
      
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfClient.send(command);
      
      const stack = response.Stacks?.[0];
      if (!stack?.Outputs) {
        logger.warning(`No outputs found for stack ${stackName}`);
        return;
      }
      
      const outputs: StackOutput[] = stack.Outputs.map(output => ({
        OutputKey: output.OutputKey || '',
        OutputValue: output.OutputValue || '',
        Description: output.Description,
        ExportName: output.ExportName
      }));
      
      // Load existing outputs
      let deploymentOutputs: DeploymentOutputs;
      try {
        const existingContent = await readFile(this.outputsFilePath, 'utf8');
        deploymentOutputs = JSON.parse(existingContent);
      } catch {
        deploymentOutputs = {
          stage,
          lastUpdated: new Date().toISOString(),
          stacks: {}
        };
      }
      
      // Update the specific stack outputs
      deploymentOutputs.stacks[stackType] = {
        region: stackRegion,
        stackName,
        outputs
      };
      deploymentOutputs.lastUpdated = new Date().toISOString();
      deploymentOutputs.stage = stage;
      
      // Ensure directory exists
      await mkdir(join(__dirname), { recursive: true });
      
      // Save updated outputs
      await writeFile(this.outputsFilePath, JSON.stringify(deploymentOutputs, null, 2));
      
      logger.success(`Saved outputs for ${stackType} stack to ${this.outputsFilePath}`);
      logger.info(`Found ${outputs.length} outputs for ${stackType} stack`);

    } catch (error: unknown) {
      logger.error(`Failed to save outputs for ${stackType} stack: ${(error as Error).message}`);
      throw error;
    }
  }

  async getStackOutputs(stackType: StackType, stage: string): Promise<StackOutput[] | null> {
    try {
      const content = await readFile(this.outputsFilePath, 'utf8');
      const deploymentOutputs: DeploymentOutputs = JSON.parse(content);
      
      if (deploymentOutputs.stage !== stage) {
        logger.warning(`Outputs file is for stage ${deploymentOutputs.stage}, but requested stage ${stage}`);
        return null;
      }
      
      return deploymentOutputs.stacks[stackType]?.outputs || null;
    } catch (error: unknown) {
      logger.warning(`Could not read outputs for ${stackType}: ${(error as Error).message}`);
      return null;
    }
  }

  async getOutputValue(stackType: StackType, stage: string, outputKey: string): Promise<string | null> {
    const outputs = await this.getStackOutputs(stackType, stage);
    if (!outputs) return null;
    
    const output = outputs.find(o => o.OutputKey === outputKey);
    return output?.OutputValue || null;
  }

  async getAllOutputs(stage: string): Promise<DeploymentOutputs | null> {
    try {
      const content = await readFile(this.outputsFilePath, 'utf8');
      const deploymentOutputs: DeploymentOutputs = JSON.parse(content);
      
      if (deploymentOutputs.stage !== stage) {
        logger.warning(`Outputs file is for stage ${deploymentOutputs.stage}, but requested stage ${stage}`);
        return null;
      }
      
      return deploymentOutputs;
    } catch (error: unknown) {
      logger.warning(`Could not read deployment outputs: ${(error as Error).message}`);
      return null;
    }
  }

  async validateStackExists(stackType: StackType, stage: string): Promise<boolean> {
    try {
      const stackName = getStackName(stackType, stage);
      const stackRegion = stackType === 'waf' ? 'us-east-1' : 'ap-southeast-2';
      const cfClient = new CloudFormationClient({ region: stackRegion });
      
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfClient.send(command);
      
      const stack = response.Stacks?.[0];
      const status = stack?.StackStatus;
      
      // Consider stack as existing and healthy if in these states
      const healthyStates = [
        'CREATE_COMPLETE',
        'UPDATE_COMPLETE',
        'UPDATE_ROLLBACK_COMPLETE'
      ];
      
      return healthyStates.includes(status || '');
    } catch (error: unknown) {
      // Type guard for error name and message (assuming error is an object with name and message properties)
      if (typeof error === 'object' && error !== null && 'name' in error && 'message' in error && 
          (error as {name: string}).name === 'ValidationError' && (error as {message: string}).message.includes('does not exist')) {
        return false;
      }
      logger.warning(`Error checking stack ${stackType}: ${(error as Error).message}`);
      return false;
    }
  }

  async clearOutputs(stage: string): Promise<void> {
    const emptyOutputs: DeploymentOutputs = {
      stage,
      lastUpdated: new Date().toISOString(),
      stacks: {}
    };
    
    await writeFile(this.outputsFilePath, JSON.stringify(emptyOutputs, null, 2));
    logger.info(`Cleared deployment outputs for stage ${stage}`);
  }
}
