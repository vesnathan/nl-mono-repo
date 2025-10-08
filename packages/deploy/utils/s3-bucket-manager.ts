import {
  S3,
  HeadBucketCommand,
  CreateBucketCommand,
  GetBucketLocationCommand,
  ListObjectsV2Command,
  PutBucketVersioningCommand,
  PutPublicAccessBlockCommand,
  BucketVersioningStatus,
} from "@aws-sdk/client-s3";
import { logger } from "./logger";

export class S3BucketManager {
  private s3Client: S3;
  private region: string;

  constructor(region: string) {
    this.region = region;
    this.s3Client = new S3({ region });
  }

  /**
   * Ensure a bucket exists and is accessible
   * @param bucketName Name of the bucket to ensure exists
   * @returns true if the bucket exists or was created successfully
   */
  async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
      logger.debug(`Checking if bucket ${bucketName} exists...`);

      // First, try to check if the bucket exists
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        logger.debug(`Bucket ${bucketName} already exists`);

        // Verify the bucket is in the correct region
        const locationResponse = await this.s3Client.send(
          new GetBucketLocationCommand({ Bucket: bucketName }),
        );

        // If LocationConstraint is null or empty string, the bucket is in us-east-1
        const bucketRegion = locationResponse.LocationConstraint || "us-east-1";
        if (
          bucketRegion !== this.region &&
          !(this.region === "us-east-1" && !locationResponse.LocationConstraint)
        ) {
          logger.warning(
            `Bucket ${bucketName} exists but in region ${bucketRegion} instead of ${this.region}`,
          );
          logger.warning(
            `Expected region ${this.region}, found ${bucketRegion}`,
          );
          // We'll still return true as the bucket exists, but this could cause issues if resolvers expect it in a different region
          return true;
        }

        // Bucket exists and is in the correct region
        return true;
      } catch (error: any) {
        if (error.name === "NotFound" || error.name === "NoSuchBucket") {
          logger.info(`Bucket ${bucketName} does not exist, will create it`);
        } else {
          logger.warning(`Error checking bucket existence: ${error.message}`);
          // Continue to create the bucket anyway as it might be a permissions issue
        }
      }

      // Create the bucket
      logger.info(`Creating bucket ${bucketName} in region ${this.region}...`);

      try {
        const createBucketParams: any = {
          Bucket: bucketName,
          ObjectOwnership: "BucketOwnerEnforced", // Enable S3 Object Ownership
        };

        // Only specify LocationConstraint if not in us-east-1 (which is the default)
        if (this.region !== "us-east-1") {
          createBucketParams.CreateBucketConfiguration = {
            LocationConstraint: this.region,
          };
        }

        await this.s3Client.send(new CreateBucketCommand(createBucketParams));
        logger.success(`Bucket ${bucketName} created successfully`);

        // Configure bucket versioning and block public access
        await this.configureBucket(bucketName);

        // Add a delay to ensure the bucket is fully available
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Verify bucket was created successfully
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

        logger.success(
          `Successfully created and configured bucket ${bucketName}`,
        );
        return true;
      } catch (createError: any) {
        // Check if the bucket already exists but is owned by us (race condition)
        if (createError.name === "BucketAlreadyOwnedByYou") {
          logger.success(
            `Bucket ${bucketName} already exists and is owned by you`,
          );
          return true;
        }

        // Check if bucket already exists but is owned by someone else
        if (createError.name === "BucketAlreadyExists") {
          logger.error(
            `Bucket ${bucketName} already exists but is owned by another account`,
          );
          return false;
        }

        // Other error creating bucket
        throw createError;
      }
    } catch (error: any) {
      logger.error(
        `Failed to ensure bucket ${bucketName} exists: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Configure S3 bucket settings including versioning and access controls
   */
  private async configureBucket(bucketName: string): Promise<void> {
    try {
      // Enable versioning on the bucket
      await this.s3Client.send(
        new PutBucketVersioningCommand({
          Bucket: bucketName,
          VersioningConfiguration: {
            Status: BucketVersioningStatus.Enabled,
          },
        }),
      );
      logger.info(`Enabled versioning on bucket ${bucketName}`);

      // Block public access
      await this.s3Client.send(
        new PutPublicAccessBlockCommand({
          Bucket: bucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            IgnorePublicAcls: true,
            BlockPublicPolicy: true,
            RestrictPublicBuckets: true,
          },
        }),
      );
      logger.info(`Blocked public access on bucket ${bucketName}`);
    } catch (error: any) {
      logger.warning(
        `Failed to configure bucket ${bucketName}: ${error.message}`,
      );
      // Don't throw here as we've already created the bucket
    }
  }

  /**
   * Verify if an object exists in the bucket
   * @param bucketName Name of the bucket
   * @param key S3 key (path) of the object
   * @returns true if the object exists
   */
  async objectExists(bucketName: string, key: string): Promise<boolean> {
    try {
      // Use ListObjectsV2 to check if the object exists since it's more reliable than HeadObject
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: key,
        MaxKeys: 1,
      });

      const response = await this.s3Client.send(command);

      // Properly type the response from ListObjectsV2Command
      const listObjectsResult = response as {
        Contents?: Array<{ Key: string }>;
      };

      // If we have Contents and the first item's Key matches our key, the object exists
      return !!(
        listObjectsResult.Contents?.length &&
        listObjectsResult.Contents[0].Key === key
      );
    } catch (error: any) {
      logger.warning(
        `Error checking if object ${key} exists in bucket ${bucketName}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Verify if objects exist in the bucket matching a prefix
   * @param bucketName Name of the bucket
   * @param prefix S3 key prefix to search for
   * @returns number of objects found, 0 if none found
   */
  async countObjectsWithPrefix(
    bucketName: string,
    prefix: string,
  ): Promise<number> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);
      // Properly type the response from ListObjectsV2Command
      const listObjectsResult = response as {
        Contents?: Array<{ Key: string }>;
      };
      return listObjectsResult.Contents?.length || 0;
    } catch (error: any) {
      logger.warning(
        `Error counting objects with prefix ${prefix} in bucket ${bucketName}: ${error.message}`,
      );
      return 0;
    }
  }
}
