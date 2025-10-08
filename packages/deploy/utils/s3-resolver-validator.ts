import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  HeadObjectCommand,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { logger } from "./logger";

/**
 * Add a policy to an S3 bucket to allow AppSync access to resolver code
 * @param bucketName S3 bucket name
 * @param region AWS region
 */
export async function addAppSyncBucketPolicy(
  bucketName: string,
  region: string,
): Promise<void> {
  const s3Client = new S3Client({ region });
  const MAX_RETRIES = 3;

  // Helper function for retry logic
  const retryOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        logger.warning(
          `Operation failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`,
        );

        if (attempt < MAX_RETRIES) {
          // Exponential backoff
          const delay = 1000 * Math.pow(2, attempt - 1);
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Operation failed after multiple retries");
  };

  try {
    logger.debug(`Checking if bucket ${bucketName} exists...`);

    // Verify bucket exists
    await retryOperation(async () => {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        logger.info(`Bucket ${bucketName} exists, checking policy...`);
      } catch (error: any) {
        logger.error(
          `Bucket ${bucketName} does not exist or is not accessible: ${error.message}`,
        );
        throw new Error(
          `Cannot add policy to non-existent bucket ${bucketName}`,
        );
      }
    });

    // Get existing policy (if any)
    let existingPolicy: Record<string, any> = {
      Version: "2012-10-17",
      Statement: [],
    };

    try {
      await retryOperation(async () => {
        try {
          const policyResponse = await s3Client.send(
            new GetBucketPolicyCommand({ Bucket: bucketName }),
          );
          if (policyResponse.Policy) {
            existingPolicy = JSON.parse(policyResponse.Policy);
            logger.info(`Retrieved existing bucket policy for ${bucketName}`);
          }
        } catch (error: any) {
          if (error.name !== "NoSuchBucketPolicy") {
            logger.warning(`Error getting bucket policy: ${error.message}`);
            throw error;
          }
          logger.info(
            `No existing bucket policy found, will create new policy`,
          );
        }
      });
    } catch (error: any) {
      logger.warning(
        `Could not retrieve bucket policy after multiple attempts: ${error.message}`,
      );
      logger.info("Proceeding with empty policy");
    }

    // Check if AppSync statement already exists
    const appSyncStatement = {
      Sid: "AllowAppSyncToAccessResolvers",
      Effect: "Allow",
      Principal: {
        Service: "appsync.amazonaws.com",
      },
      Action: ["s3:GetObject", "s3:ListBucket"],
      Resource: [`arn:aws:s3:::${bucketName}`, `arn:aws:s3:::${bucketName}/*`],
    };

    // Add AppSync statement if it doesn't exist
    let policyUpdated = false;
    if (
      !existingPolicy.Statement.some(
        (stmt: any) =>
          stmt.Sid === "AllowAppSyncToAccessResolvers" &&
          stmt.Principal?.Service === "appsync.amazonaws.com",
      )
    ) {
      existingPolicy.Statement.push(appSyncStatement);
      policyUpdated = true;
      logger.info(`Added AppSync access statement to bucket policy`);
    } else {
      logger.info(`AppSync access statement already exists in bucket policy`);
    }

    // Update policy if needed
    if (policyUpdated) {
      await retryOperation(async () => {
        try {
          await s3Client.send(
            new PutBucketPolicyCommand({
              Bucket: bucketName,
              Policy: JSON.stringify(existingPolicy),
            }),
          );
          logger.success(
            `Updated bucket policy for ${bucketName} to allow AppSync access`,
          );
        } catch (error: any) {
          logger.error(`Failed to update bucket policy: ${error.message}`);
          throw error;
        }
      });
    }

    // Verify access by listing objects
    await retryOperation(async () => {
      try {
        await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 1,
          }),
        );
        logger.success(
          `Successfully verified bucket ${bucketName} is accessible after policy update`,
        );
      } catch (error: any) {
        logger.warning(
          `Bucket ${bucketName} may have access issues after policy update: ${error.message}`,
        );
        throw error;
      }
    });
  } catch (error: any) {
    logger.error(
      `Failed to configure bucket policy for AppSync access: ${error.message}`,
    );
    throw error;
  }
}

/**
 * Verify resolvers are accessible in the S3 bucket
 * @param bucketName S3 bucket name
 * @param stage Deployment stage
 * @param region AWS region
 */
export async function verifyResolversAccessible(
  bucketName: string,
  stage: string,
  region: string,
): Promise<boolean> {
  const s3Client = new S3Client({ region });

  try {
    logger.info(
      `Verifying resolver files are accessible in bucket ${bucketName}...`,
    );

    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (error: any) {
      logger.error(
        `Bucket ${bucketName} does not exist or is not accessible: ${error.message}`,
      );
      return false;
    }

    // List resolvers
    const resolversPrefix = `resolvers/${stage}/`;
    try {
      // Add retry logic for listing objects
      const listOperation = async () => {
        try {
          return await s3Client.send(
            new ListObjectsV2Command({
              Bucket: bucketName,
              Prefix: resolversPrefix,
            }),
          );
        } catch (error: any) {
          logger.warning(
            `Error listing objects, retrying... (${error.message})`,
          );
          throw error;
        }
      };

      // Retry up to 3 times with exponential backoff
      let listResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          listResponse = await listOperation();
          break;
        } catch (error: any) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error;
          }
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCount)),
          );
        }
      }

      if (!listResponse) {
        throw new Error("Failed to list objects after multiple retries");
      }

      // Properly type the response from ListObjectsV2Command
      const listObjectsResult = listResponse as {
        Contents?: Array<{ Key: string }>;
      };
      const resolverCount = listObjectsResult.Contents?.length || 0;

      if (resolverCount === 0) {
        logger.warning(
          `No resolver files found in bucket ${bucketName} with prefix ${resolversPrefix}`,
        );
        return false;
      }

      // Try to get one resolver to verify access
      if (listObjectsResult.Contents && listObjectsResult.Contents.length > 0) {
        try {
          const firstResolver = listObjectsResult.Contents[0].Key;
          if (firstResolver) {
            // Try to get a resolver object to confirm read access
            const testOperation = async () => {
              try {
                return await s3Client.send(
                  new HeadObjectCommand({
                    Bucket: bucketName,
                    Key: firstResolver,
                  }),
                );
              } catch (error: any) {
                logger.warning(
                  `Error getting resolver object, retrying... (${error.message})`,
                );
                throw error;
              }
            };

            // Retry up to 3 times with exponential backoff
            let accessSuccessful = false;
            retryCount = 0;

            while (retryCount < maxRetries && !accessSuccessful) {
              try {
                await testOperation();
                accessSuccessful = true;
                logger.success(
                  `Successfully verified bucket ${bucketName} is readable`,
                );
              } catch (error: any) {
                retryCount++;
                if (retryCount >= maxRetries) {
                  logger.warning(
                    `Failed to verify resolver access after multiple retries: ${error.message}`,
                  );
                  break;
                }
                // Exponential backoff
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * Math.pow(2, retryCount)),
                );
              }
            }

            if (!accessSuccessful) {
              logger.warning(
                `Could not verify read access to resolver ${firstResolver}`,
              );
              return false;
            }
          }
        } catch (error: any) {
          logger.warning(
            `Bucket ${bucketName} may have access issues: ${error.message}`,
          );
          // Continue, don't fail on access test
        }
      }

      logger.success(
        `Found ${resolverCount} resolver files in bucket ${bucketName}`,
      );
      return resolverCount > 0;
    } catch (error: any) {
      logger.warning(`Error listing resolver files: ${error.message}`);
      return false;
    }
  } catch (error: any) {
    logger.error(`Failed to verify resolver accessibility: ${error.message}`);
    return false;
  }
}
