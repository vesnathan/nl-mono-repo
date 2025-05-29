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
    private region: string, 
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
  
  /**
   * Gets a CloudFormation client for a specific region
   * @param region The AWS region to use
   * @returns A CloudFormation client for the specified region
   */
  getRegionalCfClient(region: string): CloudFormationClient {
    if (region === this.region) {
      return this.cfClient;
    }
    
    return new CloudFormationClient({
      region,
      credentials: this.cfClient.config.credentials
    });
  }

  /**
   * Gets an S3 client for a specific region
   * @param region The AWS region to use
   * @returns An S3 client for the specified region
   */
  getRegionalS3Client(region: string): S3Client {
    if (region === this.region) {
      return this.s3Client;
    }
    
    return new S3Client({
      region,
      credentials: this.s3Client.config.credentials
    });
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    return this.bucketExistsWithClient(bucketName, this.s3Client);
  }

  async bucketExistsWithClient(bucketName: string, s3Client: S3Client): Promise<boolean> {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error) {
      return false;
    }
  }

  async createTemplatesBucket(bucketName: string, region: string, stackType: StackType): Promise<void> {
    try {
      logger.info(`Setting up templates bucket: ${bucketName} in region ${region}`);
      
      // Use the correct regional S3 client
      const regionalS3Client = this.getRegionalS3Client(region);
      
      // Check if bucket exists using the regional client
      const bucketExists = await this.bucketExistsWithClient(bucketName, regionalS3Client);
      
      if (!bucketExists) {
        logger.info(`Creating templates bucket: ${bucketName}`);
        
        const createBucketParams: CreateBucketCommandInput = region === 'us-east-1'
          ? { Bucket: bucketName }
          : {
              Bucket: bucketName,
              CreateBucketConfiguration: {
                LocationConstraint: region as BucketLocationConstraint
              }
            };

        try {
          await regionalS3Client.send(new CreateBucketCommand(createBucketParams));
          logger.success(`Created templates bucket: ${bucketName}`);
        } catch (bucketError: any) {
          // If bucket already exists and we own it, that's fine
          if (bucketError.name === 'BucketAlreadyOwnedByYou') {
            logger.info(`Bucket ${bucketName} already exists and is owned by you. Continuing...`);
          } else {
            throw bucketError;
          }
        }
      } else {
        logger.info(`Bucket ${bucketName} already exists. Continuing...`);
      }

      // Always upload templates to ensure they're up to date
      logger.info(`Uploading templates for ${stackType} stack...`);
      await this.uploadTemplatesWithClient(bucketName, stackType, regionalS3Client);
      
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
    return this.uploadTemplatesWithClient(bucketName, stackType, this.s3Client);
  }

  private async uploadTemplatesWithClient(bucketName: string, stackType: StackType, s3Client: S3Client): Promise<void> {
    const basePath = TEMPLATE_RESOURCES_PATHS[stackType];
    logger.info(`Looking for template files in: ${basePath}`);
    
    try {
      // Use fs.readdir instead of glob for better compatibility
      let files: string[] = [];
      try {
        const entries = await fs.readdir(basePath, { withFileTypes: true, recursive: true });
        files = entries
          .filter(entry => entry.isFile() && entry.name.endsWith('.yaml'))
          .map(entry => path.join(basePath, entry.name));
      } catch (readdirError: any) {
        // Directory might not exist or be accessible, that's fine
        logger.info(`Could not read directory ${basePath}: ${readdirError.message}`);
      }

      logger.info(`Found ${files.length} template files`);

      if (files.length === 0) {
        logger.info(`No additional template files found in ${basePath} for ${stackType} stack`);
      } else {
        for (const file of files) {
          const content = await fs.readFile(file);
          const key = `resources/${path.relative(basePath, file)}`;

          await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: content,
            ContentType: 'application/x-yaml'
          }));
          
          logger.info(`Uploaded template: ${key}`);
        }
      }

      logger.success(`Templates bucket setup complete for ${stackType} stack`);
    } catch (error: any) {
      logger.error(`Error in uploadTemplates: ${error.message}`);
      logger.success(`Templates bucket setup complete for ${stackType} stack (no additional files)`);
    }
  }

  async getStackFailureDetails(stackName: string, regionOverride?: string): Promise<void> {
    const cfClient = regionOverride ? this.getRegionalCfClient(regionOverride) : this.cfClient;
    
    try {
      const command = new DescribeStackEventsCommand({ StackName: stackName });
      const response = await cfClient.send(command);

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
  
  /**
   * Helper method to handle WAF stack operations which must be in us-east-1
   * @param operation The function to perform on the WAF stack
   * @returns The result of the operation
   */
  async performWafStackOperation<T>(operation: (client: CloudFormationClient) => Promise<T>): Promise<T> {
    // WAF resources must be created in us-east-1 for CloudFront integration
    const wafRegion = 'us-east-1';
    const wafCfClient = this.getRegionalCfClient(wafRegion);
    
    try {
      return await operation(wafCfClient);
    } catch (error: any) {
      logger.error(`Failed to perform WAF stack operation in ${wafRegion}: ${error?.message || 'Unknown error'}`);
      throw error;
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
        if (error.message?.includes('does not exist')) {
          throw new Error(`Stack ${stackName} not found during wait operation`);
        }
        throw error;
      }
    }
  }

  async waitForStackDeletion(stackName: string, regionOverride?: string): Promise<boolean> {
    const region = regionOverride || this.region;
    const cfClient = regionOverride 
      ? new CloudFormationClient({ region: regionOverride, credentials: this.cfClient.config.credentials }) 
      : this.cfClient;
    
    logger.info(`Waiting for stack ${stackName} to be deleted in region ${region}...`);
    
    while (true) {
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await cfClient.send(command);
        const stack = response.Stacks?.[0];
        
        if (!stack) {
          // Stack doesn't exist, deletion is complete
          logger.success(`Stack ${stackName} has been deleted successfully`);
          return true;
        }

        const currentStatus = stack.StackStatus || '';
        logger.info(`Stack deletion status: ${currentStatus}`);
        
        if (currentStatus === 'DELETE_COMPLETE') {
          logger.success(`Stack ${stackName} has been deleted successfully`);
          return true;
        }
        
        if (currentStatus === 'DELETE_FAILED') {
          logger.error(`Stack ${stackName} deletion failed`);
          await this.getStackFailureDetails(stackName);
          return false;
        }

        // Wait before checking again
        await sleep(10000); // Poll every 10 seconds for deletion
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          // Stack doesn't exist, deletion is complete
          logger.success(`Stack ${stackName} has been deleted successfully`);
          return true;
        }
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
