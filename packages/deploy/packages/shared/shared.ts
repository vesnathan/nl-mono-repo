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
import { DeploymentOptions, TEMPLATE_PATHS, TEMPLATE_RESOURCES_PATHS, getStackName, getTemplateBucketName } from '../../types';
import { logger } from '../../utils/logger';
import { IamManager } from '../../utils/iam-manager';
import { AwsUtils } from '../../utils/aws-utils';
import { glob } from 'glob';
import { createReadStream } from 'fs';
import { promisify } from 'util';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      logger.warning(`Operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
      await sleep(RETRY_DELAY * attempt);
    }
  }
  throw new Error('Unexpected: Should not reach here');
}

export async function deployShared(options: DeploymentOptions): Promise<void> {
  const stackName = getStackName('shared', options.stage);
  const templateBucketName = getTemplateBucketName('shared', options.stage);
  logger.info('Starting Shared Resources deployment...');

  // Initialize clients
  const cfn = new CloudFormation({ region: process.env.AWS_REGION });
  const s3 = new S3({ region: process.env.AWS_REGION });
  
  // Set up IAM role
  const iamManager = new IamManager();
  const roleArn = await iamManager.setupRole('shared', options.stage);
  if (!roleArn) {
    throw new Error('Failed to setup role for shared resources');
  }

  try {
    // Create S3 bucket for templates if it doesn't exist
    try {
      await s3.headBucket({ Bucket: templateBucketName });
    } catch (error) {
      logger.info(`Creating templates bucket: ${templateBucketName}`);
      await s3.createBucket({
        Bucket: templateBucketName,
        CreateBucketConfiguration: {
          LocationConstraint: (process.env.AWS_REGION || 'ap-southeast-2') as 'ap-southeast-2'
        }
      });
    }

    // Clear existing templates
    logger.info('Clearing existing templates...');
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
    const templateFiles = await promisify(glob)('**/*.yaml', {
      cwd: TEMPLATE_RESOURCES_PATHS.shared,
      absolute: true
    }) as string[];

    for (const file of templateFiles) {
      const key = `resources/${file.replace(TEMPLATE_RESOURCES_PATHS.shared + '/', '')}`;
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

    // Create or update the main stack
    const awsUtils = new AwsUtils(process.env.AWS_REGION || 'ap-southeast-2');
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
      await cfn.describeStacks({ StackName: stackName });
      logger.info(`Updating existing stack: ${stackName}`);
      await cfn.updateStack(stackParams);
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
