import { 
  CloudFormationClient, 
  DeleteStackCommand, 
  DescribeStacksCommand,
  StackStatus
} from '@aws-sdk/client-cloudformation';
import { 
  S3Client, 
  ListObjectsV2Command, 
  DeleteObjectsCommand,
  ListBucketsCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { logger } from './logger';
import { getStackName } from '../types';

export interface ForceDeleteOptions {
  stage: string;
  region?: string;
  skipS3Cleanup?: boolean;
  maxWaitMinutes?: number;
}

export class ForceDeleteManager {
  private cfClient: CloudFormationClient;
  private s3Client: S3Client;
  private region: string;

  constructor(region = 'ap-southeast-2') {
    this.region = region;
    this.cfClient = new CloudFormationClient({ region });
    this.s3Client = new S3Client({ region });
  }

  /**
   * Force delete a stack and associated S3 buckets
   */
  async forceDeleteStack(stackType: 'cwl' | 'shared' | 'waf', options: ForceDeleteOptions): Promise<void> {
    const { stage, region: optionRegion, skipS3Cleanup = false, maxWaitMinutes = 30 } = options;
    const stackName = getStackName(stackType, stage);
    const region = optionRegion || this.region;
    
    // Use regional clients if region is different
    const cfClient = region !== this.region 
      ? new CloudFormationClient({ region, credentials: this.cfClient.config.credentials })
      : this.cfClient;
    
    const s3Client = region !== this.region
      ? new S3Client({ region, credentials: this.s3Client.config.credentials })
      : this.s3Client;

    logger.info(`Force deleting stack: ${stackName} in region ${region}`);

    try {
      // Step 1: Check if stack exists
      let stackExists = false;
      try {
        await cfClient.send(new DescribeStacksCommand({ StackName: stackName }));
        stackExists = true;
        logger.info(`Stack ${stackName} exists, proceeding with force deletion`);
      } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
          logger.info(`Stack ${stackName} does not exist, nothing to delete`);
          return;
        }
        throw error;
      }

      // Step 2: Empty S3 buckets if requested
      if (!skipS3Cleanup && stackExists) {
        await this.emptyStackS3Buckets(stackName, s3Client, stage);
      }

      // Step 3: Force delete the stack
      if (stackExists) {
        logger.info(`Initiating force deletion of stack: ${stackName}`);
        await cfClient.send(new DeleteStackCommand({
          StackName: stackName,
          RetainResources: [] // Force delete all resources
        }));

        // Step 4: Wait for deletion to complete
        await this.waitForStackDeletion(stackName, cfClient, maxWaitMinutes);
      }

    } catch (error: any) {
      logger.error(`Error during force deletion of stack ${stackName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Empty all S3 buckets associated with a stack
   */
  private async emptyStackS3Buckets(stackName: string, s3Client: S3Client, stage: string): Promise<void> {
    logger.info(`Emptying S3 buckets for stack: ${stackName}`);

    try {
      // Get stack outputs to find S3 buckets
      const cfClient = this.cfClient;
      const stackResponse = await cfClient.send(new DescribeStacksCommand({ StackName: stackName }));
      const stack = stackResponse.Stacks?.[0];

      if (!stack?.Outputs) {
        logger.info('No stack outputs found, skipping S3 cleanup');
        return;
      }

      // Find S3 bucket names in outputs
      const bucketOutputs = stack.Outputs.filter(output => 
        output.OutputKey?.toLowerCase().includes('bucket') && 
        output.OutputValue &&
        !output.OutputKey?.toLowerCase().includes('arn') &&
        !output.OutputKey?.toLowerCase().includes('domain')
      );

      if (bucketOutputs.length === 0) {
        logger.info('No S3 buckets found in stack outputs, trying common bucket names');
        // Try common bucket name patterns
        const commonBucketNames = [
          `nlmonorepo-cwl-frontend-${stage}`,
          `nlmonorepo-cwl-templates-${stage}`,
          `nlmonorepo-shared-templates-${stage}`,
          `nlmonorepo-waf-templates-${stage}`
        ];

        for (const bucketName of commonBucketNames) {
          try {
            await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
            await this.emptyS3Bucket(bucketName, s3Client);
          } catch (error: any) {
            // Bucket doesn't exist or access denied, continue
            logger.info(`Bucket ${bucketName} not found or not accessible, skipping`);
          }
        }
        return;
      }

      // Empty each bucket found in outputs
      for (const bucketOutput of bucketOutputs) {
        const bucketName = bucketOutput.OutputValue!;
        try {
          await this.emptyS3Bucket(bucketName, s3Client);
        } catch (error: any) {
          logger.warning(`Failed to empty bucket ${bucketName}: ${error.message}`);
          // Continue with other buckets
        }
      }

    } catch (error: any) {
      logger.warning(`Failed to get stack outputs for S3 cleanup: ${error.message}`);
      // Continue with stack deletion even if S3 cleanup fails
    }
  }

  /**
   * Empty a specific S3 bucket
   */
  private async emptyS3Bucket(bucketName: string, s3Client: S3Client): Promise<void> {
    logger.info(`Emptying S3 bucket: ${bucketName}`);

    try {
      let continuationToken: string | undefined;
      let totalDeleted = 0;

      do {
        // List objects in the bucket
        const listResponse = await s3Client.send(new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken
        }));

        if (listResponse.Contents && listResponse.Contents.length > 0) {
          // Delete objects in batches (max 1000 per batch)
          const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key! }));
          
          await s3Client.send(new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: objectsToDelete
            }
          }));

          totalDeleted += objectsToDelete.length;
          logger.info(`Deleted ${objectsToDelete.length} objects from ${bucketName}`);
        }

        continuationToken = listResponse.NextContinuationToken;
      } while (continuationToken);

      if (totalDeleted > 0) {
        logger.success(`Successfully emptied bucket ${bucketName} (${totalDeleted} objects deleted)`);
      } else {
        logger.info(`Bucket ${bucketName} was already empty`);
      }

    } catch (error: any) {
      // If bucket doesn't exist or access denied, that's fine
      if (error.name === 'NoSuchBucket' || error.name === 'AccessDenied') {
        logger.info(`Bucket ${bucketName} not found or not accessible, skipping`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Wait for stack deletion to complete
   */
  private async waitForStackDeletion(
    stackName: string, 
    cfClient: CloudFormationClient, 
    maxWaitMinutes: number
  ): Promise<void> {
    const maxWaitTime = maxWaitMinutes * 60 * 1000;
    const pollInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();

    logger.info(`Waiting for stack ${stackName} deletion to complete (max ${maxWaitMinutes} minutes)...`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await cfClient.send(new DescribeStacksCommand({ StackName: stackName }));
        const stack = response.Stacks?.[0];

        if (!stack) {
          logger.success(`Stack ${stackName} has been successfully deleted`);
          return;
        }

        const status = stack.StackStatus as StackStatus;
        logger.info(`Stack deletion status: ${status}`);

        if (status === 'DELETE_COMPLETE') {
          logger.success(`Stack ${stackName} has been successfully deleted`);
          return;
        } else if (status === 'DELETE_FAILED') {
          // Try to get failure details
          await this.logStackFailureDetails(stackName, cfClient);
          throw new Error(`Stack deletion failed with status: ${status}`);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
          logger.success(`Stack ${stackName} has been successfully deleted`);
          return;
        }
        throw error;
      }
    }

    throw new Error(`Timeout waiting for stack ${stackName} to delete after ${maxWaitMinutes} minutes`);
  }

  /**
   * Log stack failure details
   */
  private async logStackFailureDetails(stackName: string, cfClient: CloudFormationClient): Promise<void> {
    try {
      const response = await cfClient.send(new DescribeStacksCommand({ StackName: stackName }));
      const stack = response.Stacks?.[0];

      if (stack?.StackStatusReason) {
        logger.error(`Stack failure reason: ${stack.StackStatusReason}`);
      }

      // Could also get stack events for more details, but keeping it simple for now
    } catch (error) {
      // Ignore errors when trying to get failure details
    }
  }

  /**
   * Force delete all stacks in the correct order
   */
  async forceDeleteAllStacks(stage: string): Promise<void> {
    logger.info(`Force deleting all stacks for stage: ${stage}`);

    const errors: string[] = [];

    // Delete in reverse dependency order: CWL -> Shared -> WAF
    const stacks = [
      { type: 'cwl' as const, region: 'ap-southeast-2' },
      { type: 'shared' as const, region: 'ap-southeast-2' },
      { type: 'waf' as const, region: 'us-east-1' }
    ];

    for (const stack of stacks) {
      try {
        await this.forceDeleteStack(stack.type, {
          stage,
          region: stack.region,
          maxWaitMinutes: 20 // Reduced time per stack since we're doing multiple
        });
      } catch (error: any) {
        const errorMessage = `Failed to force delete ${stack.type} stack: ${error.message}`;
        logger.error(errorMessage);
        errors.push(errorMessage);
        // Continue with other stacks even if one fails
      }
    }

    if (errors.length > 0) {
      logger.warning(`Force deletion completed with ${errors.length} errors:`);
      errors.forEach(err => logger.warning(` - ${err}`));
    } else {
      logger.success('All stacks force deleted successfully!');
    }
  }

  /**
   * Get the status of a CloudFormation stack
   */
  async getStackStatus(stackType: 'cwl' | 'shared' | 'waf', options: { stage: string; region?: string }): Promise<{ exists: boolean; status?: string; reason?: string }> {
    const { stage, region: optionRegion } = options;
    const stackName = getStackName(stackType, stage);
    const region = optionRegion || this.region;
    
    // Use regional client if region is different
    const cfClient = region !== this.region 
      ? new CloudFormationClient({ region, credentials: this.cfClient.config.credentials })
      : this.cfClient;

    try {
      const response = await cfClient.send(new DescribeStacksCommand({ StackName: stackName }));
      const stack = response.Stacks?.[0];

      if (!stack) {
        return { exists: false };
      }

      return {
        exists: true,
        status: stack.StackStatus,
        reason: stack.StackStatusReason
      };

    } catch (error: any) {
      if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
        return { exists: false };
      }
      throw error;
    }
  }
}
