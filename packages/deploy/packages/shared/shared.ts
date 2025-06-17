import { 
  CloudFormation, 
  Parameter,
  Capability
} from '@aws-sdk/client-cloudformation';
import { 
  S3,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
  _Object
} from '@aws-sdk/client-s3';
import { 
  IAM,
  PutRolePolicyCommand
} from '@aws-sdk/client-iam';
import { DeploymentOptions, TEMPLATE_PATHS, TEMPLATE_RESOURCES_PATHS, getStackName, getTemplateBucketName } from '../../types';
import { logger } from '../../utils/logger';
import { IamManager } from '../../utils/iam-manager';
import { AwsUtils } from '../../utils/aws-utils';
import { createReadStream, readdirSync, statSync } from 'fs';
import { join } from 'path';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (attempt === maxRetries) throw error;
      logger.warning(`Operation failed (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? error.message : String(error)}`);
      await sleep(RETRY_DELAY * attempt);
    }
  }
  throw new Error('Unexpected: Should not reach here');
}

export async function deployShared(options: DeploymentOptions): Promise<void> {
  const stackName = getStackName('shared', options.stage);
  const templateBucketName = getTemplateBucketName('shared', options.stage);
  const region = options.region || process.env.AWS_REGION || 'ap-southeast-2'; // Ensure region is available
  logger.info('Starting Shared Resources deployment...');

  // Initialize clients
  const cfn = new CloudFormation({ region });
  const s3 = new S3({ region });
  const iam = new IAM({ region });
  
  // Set up IAM role
  const iamManager = new IamManager(region); // Pass region to IamManager
  const roleArn = await iamManager.setupRole('shared', options.stage);
  if (!roleArn) {
    throw new Error('Failed to setup role for shared resources');
  }

  try {
    // Create S3 bucket for templates if it doesn't exist
    try {
      logger.info(`Checking if templates bucket exists: ${templateBucketName} in region ${region}`);
      await s3.headBucket({ Bucket: templateBucketName });
      logger.info(`Templates bucket ${templateBucketName} exists`);
    } catch (error: unknown) {
      logger.info(`Creating templates bucket: ${templateBucketName} in region ${region}`);
      logger.info(`Error details: ${error instanceof Error ? error.message : String(error)}`);
      
      if (region === 'us-east-1') {
        // us-east-1 doesn't need LocationConstraint
        await s3.createBucket({
          Bucket: templateBucketName
        });
      } else {
        await s3.createBucket({
          Bucket: templateBucketName,
          CreateBucketConfiguration: {
            LocationConstraint: region as any // Cast to any to satisfy BucketLocationConstraint
          }
        });
      }
      logger.info(`Created templates bucket: ${templateBucketName}`);
    }

    // Instead of setting bucket policy, ensure IAM role has proper permissions
    try {
      logger.info(`Ensuring CloudFormation role has S3 access to templates bucket...`);
      
      // Add specific S3 permissions to the CloudFormation role instead of bucket policy
      const roleName = `nlmonorepo-shared-${options.stage}-role`;
      
      const s3PolicyDocument = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:GetObjectVersion'
            ],
            Resource: [
              `arn:aws:s3:::${templateBucketName}/*`,
              `arn:aws:s3:::${templateBucketName}/resources/*`
            ]
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ListBucket'
            ],
            Resource: `arn:aws:s3:::${templateBucketName}`
          }
        ]
      };

      // Try to add the policy to the role (this may fail if role doesn't exist yet, which is fine)
      try {
        await iam.putRolePolicy({
          RoleName: roleName,
          PolicyName: `${roleName}-s3-templates-policy`,
          PolicyDocument: JSON.stringify(s3PolicyDocument)
        });
        logger.success(`Added S3 templates access policy to role ${roleName}`);
      } catch (roleError: unknown) {
        logger.info(`Could not update role policy (role may not exist yet): ${roleError instanceof Error ? roleError.message : String(roleError)}`);
      }
      
    } catch (error: unknown) {
      logger.warning(`Failed to configure IAM role S3 access: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Clear existing templates
    logger.info('Clearing existing templates...');
    logger.info(`Looking for templates in: ${TEMPLATE_RESOURCES_PATHS.shared}`);
    logger.info(`Current working directory: ${process.cwd()}`);
    logger.info(`__dirname resolved to: ${__dirname}`);
    
    const listCommand = new ListObjectsV2Command({ 
      Bucket: templateBucketName, 
      Prefix: 'resources/' 
    });
    const existingObjects = await retryOperation(() => s3.send(listCommand));
    
    if (existingObjects.Contents?.length) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: templateBucketName,
        Delete: {
          Objects: existingObjects.Contents.map((obj: _Object) => ({ Key: obj.Key! }))
        }
      });
      await retryOperation(() => s3.send(deleteCommand));
    }

    // Upload nested stack templates
    logger.info(`Searching for templates with pattern: **/*.yaml in ${TEMPLATE_RESOURCES_PATHS.shared}`);
    
    try {
      // Use a simpler approach to find YAML files
      const { readdir, stat } = require('fs').promises;
      const path = require('path');
      
      async function findYamlFiles(dir: string): Promise<string[]> {
        const files: string[] = [];
        try {
          const entries = await readdir(dir);
          for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stats = await stat(fullPath);
            if (stats.isDirectory()) {
              const subFiles = await findYamlFiles(fullPath);
              files.push(...subFiles);
            } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
              files.push(fullPath);
            }
          }
        } catch (err: any) {
          logger.error(`Error reading directory ${dir}: ${err.message}`);
        }
        return files;
      }
      
      const templateFiles = await findYamlFiles(TEMPLATE_RESOURCES_PATHS.shared);

      logger.info(`Found ${templateFiles.length} template files in ${TEMPLATE_RESOURCES_PATHS.shared}`);
      logger.info(`Template files: ${JSON.stringify(templateFiles, null, 2)}`);
      
      if (templateFiles.length === 0) {
        logger.error('No template files found for shared resources. Check TEMPLATE_RESOURCES_PATHS.shared and file permissions.');
        throw new Error('No template files found for shared resources.');
      }

      for (const file of templateFiles) {
        const relativePath = file.replace(TEMPLATE_RESOURCES_PATHS.shared + '/', '');
        const key = `resources/${relativePath}`;
        logger.info(`Uploading template file: ${file} to S3 key: ${key}`);
        const putCommand = new PutObjectCommand({
          Bucket: templateBucketName,
          Key: key,
          Body: createReadStream(file),
          ContentType: 'application/x-yaml'
        });
        await retryOperation(async () => {
          await s3.send(putCommand);
          logger.info(`Uploaded template: ${key}`);
        });
      }
    } catch (error: any) {
      logger.error(`Template upload operation failed: ${error.message}`);
      throw error;
    }

    // Create or update the main stack
    const awsUtils = new AwsUtils(region); // Pass region to AwsUtils
    const templateBody = await awsUtils.getTemplateBody('shared');
    
    const stackParams = {
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        {
          ParameterKey: 'Stage',
          ParameterValue: options.stage,
        },
        {
          ParameterKey: 'TemplatesBucketName',
          ParameterValue: templateBucketName,
        }
      ] as Parameter[],
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'] as Capability[],
      RoleARN: roleArn,
      Tags: [
        {
          Key: 'Stage',
          Value: options.stage
        }
      ]
    };

    // Create or update the main stack
    try {
      const stackInfo = await cfn.describeStacks({ StackName: stackName });
      const stackStatus = stackInfo.Stacks?.[0]?.StackStatus;
      
      if (stackStatus === 'ROLLBACK_COMPLETE') {
        logger.warning(`Stack ${stackName} is in ROLLBACK_COMPLETE state. Deleting and recreating...`);
        await cfn.deleteStack({ StackName: stackName });
        
        // Wait for deletion to complete
        logger.info('Waiting for stack deletion to complete...');
        await awsUtils.waitForStackDeletion(stackName);
        
        // Now create new stack
        logger.info(`Creating new stack: ${stackName}`);
        await cfn.createStack(stackParams);
      } else {
        logger.info(`Updating existing stack: ${stackName}`);
        await cfn.updateStack(stackParams);
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        logger.info(`Creating new stack: ${stackName}`);
        await cfn.createStack(stackParams);
      } else if (error.message?.includes('No updates are to be performed')) {
        logger.info('No updates required for Shared Resources stack');
        return;
      } else {
        throw error;
      }
    }

    // Wait for stack completion using polling
    logger.info('Waiting for stack operation to complete...');
    const success = await awsUtils.waitForStack(stackName);
    
    if (success) {
      logger.success('Shared Resources deployment completed successfully');
    } else {
      throw new Error('Shared Resources deployment failed');
    }

  } catch (error: any) {
    logger.error(`Shared Resources deployment failed: ${error.message}`);
    throw error;
  }
}
