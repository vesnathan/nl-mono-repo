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
import { DeploymentOptions, StackType, TEMPLATE_RESOURCES_PATHS, getStackName, getTemplateBucketName } from '../../types';
import { logger } from '../../utils/logger';
import { IamManager } from '../../utils/iam-manager';
import { AwsUtils } from '../../utils/aws-utils';
import { createReadStream, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const findYamlFiles = (dir: string): string[] => {
  const files = readdirSync(dir);
  let yamlFiles: string[] = [];

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      yamlFiles = yamlFiles.concat(findYamlFiles(filePath));
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      yamlFiles.push(filePath);
    }
  }

  return yamlFiles;
}

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
  const stackName = getStackName(StackType.Shared, options.stage);
  const templateBucketName = getTemplateBucketName(StackType.Shared, options.stage);
  const region = options.region || process.env.AWS_REGION || 'ap-southeast-2'; // Ensure region is available
  
  const stopSpinner = logger.infoWithSpinner(`Starting Shared stack deployment in ${region}`);

  // Initialize clients
  const cfn = new CloudFormation({ region });
  const s3 = new S3({ region });
  const iam = new IAM({ region });
  
  // Set up IAM role
  const iamManager = new IamManager(region); // Pass region to IamManager
  const roleArn = await iamManager.setupRole(StackType.Shared, options.stage);
  if (!roleArn) {
    throw new Error('Failed to setup role for shared resources');
  }

  // Wait for IAM role to propagate
  logger.debug('Waiting 10 seconds for IAM role to propagate...');
  await sleep(10000);

  try {
    // Create S3 bucket for templates if it doesn't exist
    try {
      logger.debug(`Checking if templates bucket exists: ${templateBucketName} in region ${region}`);
      await s3.headBucket({ Bucket: templateBucketName });
      logger.debug(`Templates bucket ${templateBucketName} exists`);
    } catch (error: unknown) {
      logger.debug(`Creating templates bucket: ${templateBucketName} in region ${region}`);
      logger.debug(`Error details: ${error instanceof Error ? error.message : String(error)}`);
      
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
      logger.debug(`Created templates bucket: ${templateBucketName}`);
    }

    // Instead of setting bucket policy, ensure IAM role has proper permissions
    try {
      logger.debug(`Ensuring CloudFormation role has S3 access to templates bucket...`);
      
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
        logger.debug(`Added S3 templates access policy to role ${roleName}`);
      } catch (roleError: unknown) {
        logger.info(`Could not update role policy (role may not exist yet): ${roleError instanceof Error ? roleError.message : String(roleError)}`);
      }
      
    } catch (error: unknown) {
      logger.warning(`Failed to configure IAM role S3 access: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Clear existing templates
    logger.debug('Clearing existing templates...');
    logger.debug(`Looking for templates in: ${TEMPLATE_RESOURCES_PATHS[StackType.Shared]}`);
    logger.debug(`Current working directory: ${process.cwd()}`);
    logger.debug(`__dirname resolved to: ${__dirname}`);
    
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
    logger.debug(`Searching for templates with pattern: **/*.yaml in ${TEMPLATE_RESOURCES_PATHS[StackType.Shared]}`);
    
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
      
      const templateFiles = await findYamlFiles(TEMPLATE_RESOURCES_PATHS[StackType.Shared]);

      logger.debug(`Found ${templateFiles.length} template files in ${TEMPLATE_RESOURCES_PATHS[StackType.Shared]}`);
      logger.debug(`Template files: ${JSON.stringify(templateFiles, null, 2)}`);
      
      if (templateFiles.length === 0) {
        logger.error('No template files found for shared resources. Check TEMPLATE_RESOURCES_PATHS.shared and file permissions.');
        throw new Error('No template files found for shared resources.');
      }

      for (const file of templateFiles) {
        const s3Key = relative(TEMPLATE_RESOURCES_PATHS[StackType.Shared], file).replace(/\\/g, '/');
        
        logger.debug(`Uploading ${file} to s3://${templateBucketName}/${s3Key}`);
        
        await s3.send(new PutObjectCommand({
          Bucket: templateBucketName,
          Key: s3Key,
          Body: createReadStream(file),
          ContentType: 'application/x-yaml',
        }));
      }
    } catch (error: any) {
      logger.error(`Template upload operation failed: ${error.message}`);
      throw error;
    }

    // Create or update the main stack
    const awsUtils = new AwsUtils(region); // Pass region to AwsUtils
    const templateBody = await awsUtils.getTemplateBody(StackType.Shared);
    
    const stackParams = {
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        {
          ParameterKey: 'Stage',
          ParameterValue: options.stage,
        },
        {
          ParameterKey: 'TemplateBucketName',
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
        logger.debug('Waiting for stack deletion to complete...');
        await awsUtils.waitForStackDeletion(stackName);
        
        // Now create new stack
        logger.debug(`Creating new stack: ${stackName}`);
        await cfn.createStack(stackParams);
      } else {
        logger.debug(`Updating existing stack: ${stackName}`);
        await cfn.updateStack(stackParams);
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        logger.debug(`Creating new stack: ${stackName}`);
        await cfn.createStack(stackParams);
      } else if (error.message?.includes('No updates are to be performed')) {
        logger.debug('No updates required for Shared Resources stack');
        return;
      } else {
        throw error;
      }
    }

    // Wait for stack completion using polling
    logger.debug('Waiting for stack operation to complete...');
    const success = await awsUtils.waitForStack(stackName);
    
    if (success) {
      logger.debug('Shared Resources deployment completed successfully');
      stopSpinner();
    } else {
      stopSpinner();
      throw new Error('Shared Resources deployment failed');
    }

  } catch (error: any) {
    stopSpinner();
    logger.error(`Shared Resources deployment failed: ${error.message}`);
    throw error;
  }
}
