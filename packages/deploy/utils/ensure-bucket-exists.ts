import { S3 } from '@aws-sdk/client-s3';
import { logger } from './logger';

/**
 * Ensures that the specified S3 bucket exists, creating it if necessary
 */
export async function ensureBucketExists(bucketName: string, region: string): Promise<boolean> {
  const s3 = new S3({ region });
  
  try {
    logger.info(`Checking if bucket exists: ${bucketName}`);
    await s3.headBucket({ Bucket: bucketName });
    logger.info(`Bucket ${bucketName} already exists`);
    return true;
  } catch (error: any) {
    if (error.name !== 'NotFound' && error.name !== 'NoSuchBucket') {
      logger.error(`Error checking bucket: ${error.message}`);
      throw error;
    }
    
    logger.info(`Creating bucket: ${bucketName}`);
    
    try {
      // Create bucket with or without location constraint based on region
      const createBucketParams: any = { Bucket: bucketName };
      
      // Only specify LocationConstraint if not in us-east-1 (which is the default)
      if (region !== 'us-east-1') {
        createBucketParams.CreateBucketConfiguration = {
          LocationConstraint: region
        };
      }
      
      await s3.createBucket(createBucketParams);
      
      // Wait for the bucket to become available
      for (let i = 0; i < 5; i++) {
        try {
          await s3.headBucket({ Bucket: bucketName });
          logger.success(`Bucket ${bucketName} successfully created and is available`);
          return true;
        } catch (err) {
          if (i === 4) {
            logger.error(`Bucket ${bucketName} was created but is not yet available after multiple retries`);
            throw err;
          }
          logger.info(`Waiting for bucket ${bucketName} to become available...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }
      
      return true;
    } catch (createError: any) {
      logger.error(`Failed to create bucket ${bucketName}: ${createError.message}`);
      throw createError;
    }
  }
}
