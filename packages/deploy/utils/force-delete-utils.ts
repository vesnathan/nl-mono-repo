import {
  CloudFormationClient,
  DescribeStacksCommand,
  DeleteStackCommand,
  Stack,
  Output,
  StackStatus,
} from "@aws-sdk/client-cloudformation";
import {
  S3Client,
  ListObjectsV2Command, // Will be replaced by ListObjectVersionsCommand for emptying
  DeleteObjectsCommand,
  ObjectIdentifier,
  HeadBucketCommand,
  DeleteBucketCommand,
  ListObjectVersionsCommand, // Added for versioning
  ObjectVersion,           // Added for versioning
  DeleteMarkerEntry,       // Added for versioning
} from "@aws-sdk/client-s3";
import { IAMClient } from "@aws-sdk/client-iam"; 
import { logger } from "./logger";
import { StackType } from "../types"; 

export class ForceDeleteManager {
  private cfnClient: CloudFormationClient;
  public s3Client: S3Client;
  private iamClient: IAMClient;
  private region: string;

  constructor(region: string, _deploymentStage?: string) {
    this.region = region;
    this.cfnClient = new CloudFormationClient({ region: this.region });
    this.s3Client = new S3Client({ region: this.region });
    this.iamClient = new IAMClient({ region: this.region });
  }

  public async emptyStackS3Buckets(
    stackIdentifier: string, 
    stackType: StackType,
    stage: string,
  ): Promise<void> {
    logger.info(
      `Attempting to empty S3 buckets related to stack identifier ${stackIdentifier} (type: ${stackType}) in stage ${stage}...`,
    );
    let bucketsToEmpty: string[] = [];
    const fullStackName = `${stackIdentifier}-${stage}`;

    try {
      const stack = await this.getStack(fullStackName);
      if (stack && stack.Outputs) {
        const s3OutputKeys = [
          "WAFLogsBucketName", 
          "FrontendBucketName", 
          "TemplatesBucketName", 
        ];

        stack.Outputs.forEach((output: Output) => {
          if (output.OutputKey && s3OutputKeys.includes(output.OutputKey) && output.OutputValue) {
            logger.info(
              `Found S3 bucket ${output.OutputValue} from stack outputs for ${fullStackName}.`,
            );
            if (!bucketsToEmpty.includes(output.OutputValue)) {
              bucketsToEmpty.push(output.OutputValue);
            }
          }
        });
      }
    } catch (error) {
      logger.warning(`Could not get stack outputs for ${fullStackName} to find S3 buckets (stack might not exist): ${(error as Error).message}`);
    }

    logger.info(
      `Checking for S3 buckets by naming convention for type ${stackType} and stage ${stage}...`,
    );
    const conventionalBuckets: string[] = [];
    
    if (stackType === 'waf') {
      conventionalBuckets.push(`nlmonorepo-waf-logs-${stage}`);
      conventionalBuckets.push(`nlmonorepo-waf-templates-${stage}`); // Added for WAF templates bucket
    } else if (stackType === 'cwl') {
      conventionalBuckets.push(`nlmonorepo-cwl-frontend-${stage}`);
      conventionalBuckets.push(`nlmonorepo-cwl-templates-${stage}`);
    } else if (stackType === 'shared') {
        conventionalBuckets.push(`nlmonorepo-shared-templates-${stage}`);
    }

    // Removed redundant conditional blocks based on stackIdentifier, as it's typically nlmonorepo-${stackType}
    // e.g., if (stackIdentifier.toLowerCase().includes('waf')) { conventionalBuckets.push(`${stackIdentifier}-logs-${stage}`); }

    conventionalBuckets.forEach(bucketName => {
      if (bucketName && !bucketsToEmpty.includes(bucketName)) {
        bucketsToEmpty.push(bucketName);
      }
    });
    
    bucketsToEmpty = [...new Set(bucketsToEmpty.filter(b => b))];

    if (bucketsToEmpty.length === 0) {
        logger.info(`No S3 buckets identified for cleanup for stack type ${stackType}, stage ${stage}, identifier ${stackIdentifier}.`);
    } else {
        logger.info(`Identified buckets for potential cleanup: ${bucketsToEmpty.join(', ')}`);
    }

    for (const bucketName of bucketsToEmpty) {
      await this.emptyS3Bucket(bucketName);
    }
    logger.info(
      `S3 bucket cleanup attempt phase completed for stack type ${stackType}, stage ${stage}, identifier ${stackIdentifier}.`,
    );
  }

  private async emptyS3Bucket(bucketName: string): Promise<void> {
    if (!bucketName) {
        logger.warning("Attempted to empty a bucket with no name. Skipping.");
        return;
    }
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      logger.info(`Attempting to empty S3 bucket ${bucketName} (versioning aware)...`);
    } catch (error: any) {
      if (error.name === 'NoSuchBucket' || error.name === 'NotFound' || (error.$metadata && error.$metadata.httpStatusCode === 404)) {
        logger.info(`S3 bucket ${bucketName} does not exist, skipping emptying.`);
        return;
      }
      logger.warning(`Error checking S3 bucket ${bucketName}: ${error.message}. It might be inaccessible or another issue occurred. Skipping emptying.`);
      return;
    }

    try {
      let KeyMarker: string | undefined;
      let VersionIdMarker: string | undefined;
      do {
        const listVersionsResponse = await this.s3Client.send(
          new ListObjectVersionsCommand({
            Bucket: bucketName,
            KeyMarker,
            VersionIdMarker,
          }),
        );

        const objectsToDelete: ObjectIdentifier[] = [];
        if (listVersionsResponse.Versions) {
          listVersionsResponse.Versions.forEach((version: ObjectVersion) => {
            if (version.Key && version.VersionId) {
              objectsToDelete.push({ Key: version.Key, VersionId: version.VersionId });
            }
          });
        }
        if (listVersionsResponse.DeleteMarkers) {
          listVersionsResponse.DeleteMarkers.forEach((marker: DeleteMarkerEntry) => {
            if (marker.Key && marker.VersionId) {
              objectsToDelete.push({ Key: marker.Key, VersionId: marker.VersionId });
            }
          });
        }

        if (objectsToDelete.length > 0) {
          await this.s3Client.send(
            new DeleteObjectsCommand({
              Bucket: bucketName,
              Delete: { Objects: objectsToDelete },
            }),
          );
          logger.info(`Deleted ${objectsToDelete.length} object versions/delete markers from ${bucketName}.`);
        } else {
          logger.info(`No object versions or delete markers found in ${bucketName} in this batch.`);
        }
        KeyMarker = listVersionsResponse.NextKeyMarker;
        VersionIdMarker = listVersionsResponse.NextVersionIdMarker;
      } while (KeyMarker || VersionIdMarker);
      logger.info(`Successfully emptied S3 bucket ${bucketName} (all versions and delete markers).`);
    } catch (error) {
      logger.error(`Failed to empty S3 bucket ${bucketName} (versioning aware): ${(error as Error).message}`);
      // Do not re-throw, allow attempt to delete bucket anyway, which will fail if not empty
    }
  }

  // New private method to delete an S3 bucket
  private async deleteS3Bucket(bucketName: string): Promise<void> {
    if (!bucketName) {
      logger.warning("Attempted to delete a bucket with no name. Skipping.");
      return;
    }
    try {
      // Check if bucket exists before attempting to delete
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      logger.info(`Bucket ${bucketName} exists. Attempting to delete...`);
      await this.s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
      logger.info(`Successfully deleted S3 bucket ${bucketName}.`);
    } catch (error: any) {
      if (error.name === 'NoSuchBucket' || error.name === 'NotFound' || (error.$metadata && error.$metadata.httpStatusCode === 404)) {
        logger.info(`S3 bucket ${bucketName} does not exist, skipping deletion.`);
      } else {
        logger.error(`Failed to delete S3 bucket ${bucketName}: ${error.message}. This might be due to permissions or other issues.`);
        // Do not re-throw, as this is a best-effort cleanup
      }
    }
  }

  // New public method to delete conventionally named buckets
  public async deleteConventionalBuckets(
    baseIdentifier: string, // baseIdentifier might be like 'nlmonorepo-cwl', 'nlmonorepo-waf'
    stackType: StackType,
    stage: string,
  ): Promise<void> {
    logger.info(
      `Attempting to delete conventionally named S3 buckets for identifier ${baseIdentifier}, type ${stackType}, stage ${stage}...`,
    );

    const conventionalBucketsToDelete: string[] = [];
    // Logic to identify conventional buckets, similar to emptyStackS3Buckets
    if (stackType === 'waf') {
      conventionalBucketsToDelete.push(`nlmonorepo-waf-logs-${stage}`);
      conventionalBucketsToDelete.push(`nlmonorepo-waf-templates-${stage}`);
    } else if (stackType === 'cwl') {
      // For 'cwl', we might have frontend and templates buckets
      // Example: nlmonorepo-cwl-frontend-dev, nlmonorepo-cwl-templates-dev
      // The baseIdentifier 'nlmonorepo-cwl' is consistent with this.
      conventionalBucketsToDelete.push(`${baseIdentifier}-frontend-${stage}`); // e.g., nlmonorepo-cwl-frontend-dev
      conventionalBucketsToDelete.push(`${baseIdentifier}-templates-${stage}`); // e.g., nlmonorepo-cwl-templates-dev
    } else if (stackType === 'shared') {
      // Example: nlmonorepo-shared-templates-dev
      conventionalBucketsToDelete.push(`${baseIdentifier}-templates-${stage}`); // e.g., nlmonorepo-shared-templates-dev
    }
    // Add other conventional bucket patterns here if necessary

    // Filter out any empty or duplicate names, though the construction logic should prevent this.
    const uniqueBucketsToDelete = [...new Set(conventionalBucketsToDelete.filter(b => b))];

    if (uniqueBucketsToDelete.length === 0) {
      logger.info(
        `No conventionally named S3 buckets identified for deletion for identifier ${baseIdentifier}, type ${stackType}, stage ${stage}.`,
      );
      return;
    }

    logger.info(
      `Identified conventional buckets for deletion attempt: ${uniqueBucketsToDelete.join(', ')}`,
    );

    for (const bucketName of uniqueBucketsToDelete) {
      logger.info(`Processing deletion for conventional bucket: ${bucketName}`);
      // First, ensure the bucket is empty
      await this.emptyS3Bucket(bucketName);
      // Then, attempt to delete the bucket itself
      await this.deleteS3Bucket(bucketName);
    }

    logger.info(
      `Conventional S3 bucket deletion attempt phase completed for identifier ${baseIdentifier}, type ${stackType}, stage ${stage}.`,
    );
  }

  public async forceDeleteStack(
    stackIdentifier: string,
    stackType: StackType,
    stage: string,
    skipS3Cleanup: boolean = false,
  ): Promise<void> {
    const stackName = `${stackIdentifier}-${stage}`;
    logger.info(`Starting force delete for stack: ${stackName} (type: ${stackType})`);

    if (!skipS3Cleanup) {
      await this.emptyStackS3Buckets(stackIdentifier, stackType, stage);
    } else {
      logger.info(`Skipping S3 bucket cleanup for ${stackName} as requested.`);
    }
    
    const stack = await this.getStack(stackName);

    if (!stack) {
      logger.info(`Stack ${stackName} does not exist, no CloudFormation stack to delete.`);
      return;
    }
    
    logger.info(`Stack ${stackName} exists with status ${stack.StackStatus || 'UNKNOWN'}. Proceeding with deletion attempt.`);

    try {
      await this.cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
      logger.info(`DeleteStack command issued for ${stackName}. Waiting for deletion...`);
      await this.waitForStackDeletion(stackName);
    } catch (error) {
      logger.error(`Failed to delete stack ${stackName}: ${(error as Error).message}`);
      throw error;
    }
  }

  private async getStack(stackName: string): Promise<Stack | undefined> {
    try {
      const { Stacks } = await this.cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName }),
      );
      if (Stacks && Stacks.length > 0 && Stacks[0]) {
        return Stacks[0];
      }
      return undefined;
    } catch (error: any) {
      if (error.name === 'ValidationError' && error.message && error.message.toLowerCase().includes("does not exist")) {
        return undefined;
      }
      if (error.$metadata && error.$metadata.httpStatusCode === 400 && error.message && error.message.toLowerCase().includes("does not exist")) {
         return undefined;
      }
      logger.warning(`Error describing stack ${stackName}: ${error.message}. Assuming it does not exist or is inaccessible for safety in delete flows.`);
      return undefined; 
    }
  }

  public async waitForStackDeletion(stackName: string): Promise<void> {
    const maxAttempts = 60; 
    const delay = 30000; 

    for (let i = 0; i < maxAttempts; i++) {
      if (i > 0) { 
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      try {
        const stack = await this.getStack(stackName);
        if (!stack) {
          logger.info(`Stack ${stackName} successfully deleted (verified by getStack).`);
          return; 
        }
        const status = stack.StackStatus;
        if (status === StackStatus.DELETE_FAILED) {
          const reason = stack.StackStatusReason || 'No reason provided';
          logger.error(`Stack ${stackName} deletion failed. Status: ${status}. Reason: ${reason}`);
          throw new Error(
            `Stack ${stackName} deletion failed. Status: ${status}. Reason: ${reason}`,
          );
        }
        if (status === StackStatus.DELETE_COMPLETE) { 
             logger.info(`Stack ${stackName} successfully deleted. Status: ${status}`);
             return;
        }
        logger.info(
          `Waiting for stack ${stackName} to delete... Current status: ${status || 'UNKNOWN'} (Attempt ${i + 1}/${maxAttempts})`,
        );
      } catch (error: any) {
        throw error; 
      }
    }
    throw new Error(`Stack ${stackName} deletion timed out after ${maxAttempts * delay / 1000 / 60} minutes.`);
  }
}
