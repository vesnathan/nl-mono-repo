import { 
  S3Client, 
  HeadBucketCommand, 
  CreateBucketCommand, 
  PutObjectCommand, 
  BucketLocationConstraint,
  CreateBucketCommandInput,
  S3ClientConfig
} from '@aws-sdk/client-s3';
import { 
  CloudFormationClient, 
  DescribeStacksCommand,
  DescribeStackEventsCommand,
  CloudFormationClientConfig,
  StackStatus
} from '@aws-sdk/client-cloudformation';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { glob as globCb } from 'glob';
import path from 'path';
import { logger } from './logger';
import { StackType, TEMPLATE_RESOURCES_PATHS, TEMPLATE_PATHS } from '../types';

const glob = promisify(globCb);

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const FINAL_STATUSES = new Set([
  'CREATE_COMPLETE',
  'CREATE_FAILED',
  'ROLLBACK_COMPLETE',
  'ROLLBACK_FAILED',
  'UPDATE_COMPLETE',
  'UPDATE_ROLLBACK_COMPLETE',
  'UPDATE_ROLLBACK_FAILED',
  'DELETE_COMPLETE',
  'DELETE_FAILED'
]);

const IN_PROGRESS_STATUSES = new Set([
  'CREATE_IN_PROGRESS',
  'DELETE_IN_PROGRESS',
  'ROLLBACK_IN_PROGRESS',
  'UPDATE_IN_PROGRESS',
  'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
  'UPDATE_ROLLBACK_IN_PROGRESS',
  'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS'
]);

export class AwsUtils {
  private s3Client: S3Client;
  private cfClient: CloudFormationClient;
  private lastEventId: string | undefined;

  constructor(
    region: string, 
    credentials?: AwsCredentialIdentity
  ) {
    const s3Config: S3ClientConfig = { region };
    const cfConfig: CloudFormationClientConfig = { region };

    if (credentials) {
      s3Config.credentials = credentials;
      cfConfig.credentials = credentials;
    }

    this.s3Client = new S3Client(s3Config);
    this.cfClient = new CloudFormationClient(cfConfig);
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error) {
      return false;
    }
  }

  async createTemplatesBucket(bucketName: string, region: string, stackType: StackType): Promise<void> {
    try {
      if (!await this.bucketExists(bucketName)) {
        logger.info(`Creating templates bucket: ${bucketName}`);
        
        const createBucketParams: CreateBucketCommandInput = region === 'us-east-1'
          ? { Bucket: bucketName }
          : {
              Bucket: bucketName,
              CreateBucketConfiguration: {
                LocationConstraint: region as BucketLocationConstraint
              }
            };

        await this.s3Client.send(new CreateBucketCommand(createBucketParams));
      }

      await this.uploadTemplates(bucketName, stackType);
    } catch (error: any) {
      logger.error(`Failed to create or configure bucket: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  async getTemplateBody(stackType: StackType): Promise<string> {
    try {
      const templatePath = TEMPLATE_PATHS[stackType];
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error: any) {
      logger.error(`Failed to read template for ${stackType}: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  private async uploadTemplates(bucketName: string, stackType: StackType): Promise<void> {
    const basePath = TEMPLATE_RESOURCES_PATHS[stackType];
    const files = await glob('**/*.yaml', { 
      cwd: basePath,
      absolute: true
    }) as string[];

    for (const file of files) {
      const content = await fs.readFile(file);
      const key = `resources/${path.relative(basePath, file)}`;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: content,
        ContentType: 'application/x-yaml'
      }));
      
      logger.info(`Uploaded template: ${key}`);
    }

    logger.success(`Templates bucket setup complete for ${stackType} stack`);
  }

  async getStackFailureDetails(stackName: string): Promise<void> {
    try {
      const command = new DescribeStackEventsCommand({ StackName: stackName });
      const response = await this.cfClient.send(command);

      const failedEvents = response.StackEvents?.filter(event => 
        ['CREATE_FAILED', 'UPDATE_FAILED', 'DELETE_FAILED'].includes(event.ResourceStatus || '')
      );

      if (failedEvents && failedEvents.length > 0) {
        logger.error(`Stack failure details for ${stackName}:`);
        failedEvents.forEach(event => {
          logger.error(`Resource: ${event.LogicalResourceId} (${event.ResourceType})`);
          logger.error(`Reason: ${event.ResourceStatusReason}`);
        });
      }
    } catch (error: any) {
      logger.error(`Failed to get stack failure details: ${error?.message || 'Unknown error'}`);
    }
  }

  async waitForStack(stackName: string): Promise<boolean> {
    let lastStatus: string | undefined;
    
    while (true) {
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await this.cfClient.send(command);
        const stack = response.Stacks?.[0];
        
        if (!stack) {
          throw new Error(`Stack ${stackName} not found`);
        }

        const currentStatus = stack.StackStatus || '';
        
        // Log status changes and new events
        if (currentStatus !== lastStatus) {
          logger.info(`Stack status: ${currentStatus}`);
          lastStatus = currentStatus;
        }
        
        await this.logNewStackEvents(stackName);

        // Check if we've reached a final state
        if (FINAL_STATUSES.has(currentStatus)) {
          const success = currentStatus.includes('COMPLETE') && !currentStatus.includes('ROLLBACK');
          if (!success) {
            logger.error(`Stack ${stackName} failed: ${currentStatus}`);
            await this.getStackFailureDetails(stackName);
          }
          return success;
        }

        // If still in progress, wait before checking again
        if (IN_PROGRESS_STATUSES.has(currentStatus)) {
          await sleep(5000); // Poll every 5 seconds
          continue;
        }

        // Unexpected status
        throw new Error(`Unexpected stack status: ${currentStatus}`);
      } catch (error: any) {
        logger.error(`Error checking stack status: ${error?.message || 'Unknown error'}`);
        throw error;
      }
    }
  }

  private async logNewStackEvents(stackName: string): Promise<void> {
    try {
      const command = new DescribeStackEventsCommand({ StackName: stackName });
      const response = await this.cfClient.send(command);
      
      if (!response.StackEvents?.length) return;

      // Process events in chronological order
      const events = [...response.StackEvents].reverse();
      
      for (const event of events) {
        // Skip if we've seen this event before
        if (this.lastEventId === event.EventId) break;
        
        // Skip if this is our first check (only show new events)
        if (!this.lastEventId) {
          this.lastEventId = event.EventId;
          break;
        }

        // Log the event
        const resourceStatus = event.ResourceStatus || 'UNKNOWN';
        const logMessage = `${event.LogicalResourceId}: ${resourceStatus}`;
        
        if (resourceStatus.includes('FAILED')) {
          logger.error(`${logMessage} - ${event.ResourceStatusReason || 'No reason provided'}`);
        } else if (resourceStatus.includes('IN_PROGRESS')) {
          logger.info(logMessage);
        } else if (resourceStatus.includes('COMPLETE')) {
          logger.success(logMessage);
        }
      }

      // Update the last seen event
      if (events[0]) {
        this.lastEventId = events[0].EventId;
      }
    } catch (error: any) {
      logger.error(`Failed to get stack events: ${error?.message || 'Unknown error'}`);
    }
  }
}
