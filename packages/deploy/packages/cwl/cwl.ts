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
import { DeploymentOptions, TEMPLATE_RESOURCES_PATHS, getStackName, getTemplateBucketName } from '../../types';
import { logger } from '../../utils/logger';
import { IamManager } from '../../utils/iam-manager';
import { AwsUtils } from '../../utils/aws-utils';
import { createReadStream } from 'fs';
import * as fs from 'fs';
import * as path from 'path';

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

// Recursively find all .yaml files
function findYamlFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findYamlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function deployCwl(options: DeploymentOptions): Promise<void> {
  const stackName = getStackName('cwl', options.stage);
  const templateBucketName = getTemplateBucketName('cwl', options.stage);
  logger.info('Starting CloudWatch Live deployment...');

  // Initialize clients
  const cfn = new CloudFormation({ region: process.env.AWS_REGION });
  const s3 = new S3({ region: process.env.AWS_REGION });
  
  // Set up IAM role
  const iamManager = new IamManager();
  const roleArn = await iamManager.setupRole('cwl', options.stage);
  if (!roleArn) {
    throw new Error('Failed to setup role for CloudWatch Live');
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
          LocationConstraint: process.env.AWS_REGION as 'ap-southeast-2'
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
    logger.info(`Found ${existingObjects.Contents?.length || 0} existing objects to delete`);
    
    if (existingObjects.Contents?.length) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: templateBucketName,
        Delete: {
          Objects: existingObjects.Contents.map((obj: _Object) => ({ Key: obj.Key! }))
        }
      });
      await retryOperation(() => s3.send(deleteCommand));
      logger.info('Deleted existing templates');
    }
    
    // Upload nested stack templates
    logger.info(`Looking for templates in: ${TEMPLATE_RESOURCES_PATHS.cwl}`);
    const templateFiles = findYamlFiles(TEMPLATE_RESOURCES_PATHS.cwl);
    logger.info(`Found ${templateFiles.length} template files`);

    for (const file of templateFiles) {
      const relativePath = path.relative(TEMPLATE_RESOURCES_PATHS.cwl, file);
      const key = `resources/${relativePath}`;
      logger.info(`Uploading ${file} to ${key}`);
      
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

    // Get KMS Key info from shared stack outputs
    const sharedStack = await cfn.describeStacks({
      StackName: getStackName('shared', options.stage)
    });
    
    const kmsKeyId = sharedStack.Stacks?.[0]?.Outputs?.find(
      output => output.OutputKey === 'KMSKeyId'
    )?.OutputValue;

    const kmsKeyArn = sharedStack.Stacks?.[0]?.Outputs?.find(
      output => output.OutputKey === 'KMSKeyArn'
    )?.OutputValue;

    if (!kmsKeyId || !kmsKeyArn) {
      throw new Error('Failed to get KMS key information from shared stack');
    }

    // Get WAF Web ACL ID and ARN from us-east-1 region
    const wafCfn = new CloudFormation({ region: 'us-east-1' });
    const wafStack = await wafCfn.describeStacks({
      StackName: getStackName('waf', options.stage)
    });
    
    const webAclId = wafStack.Stacks?.[0]?.Outputs?.find(
      output => output.OutputKey === 'WebACLId'
    )?.OutputValue;

    const webAclArn = wafStack.Stacks?.[0]?.Outputs?.find(
      output => output.OutputKey === 'WebACLArn'
    )?.OutputValue;

    if (!webAclId || !webAclArn) {
      throw new Error('Failed to get WAF Web ACL ID and ARN from WAF stack in us-east-1');
    }

    // Create or update the main stack
    const awsUtils = new AwsUtils(process.env.AWS_REGION || 'ap-southeast-2');
    const templateBody = await awsUtils.getTemplateBody('cwl');
    
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
        },
        {
          ParameterKey: 'KMSKeyId',
          ParameterValue: kmsKeyId,
        },
        {
          ParameterKey: 'KMSKeyArn',
          ParameterValue: kmsKeyArn,
        },
        {
          ParameterKey: 'WebAclId',
          ParameterValue: webAclId,
        },
        {
          ParameterKey: 'WebAclArn',
          ParameterValue: webAclArn,
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
      const existingStack = await cfn.describeStacks({ StackName: stackName });
      const stackStatus = existingStack.Stacks?.[0]?.StackStatus;
      
      // Wait for rollback to complete if in progress
      if (stackStatus === 'ROLLBACK_IN_PROGRESS' || 
          stackStatus === 'UPDATE_ROLLBACK_IN_PROGRESS') {
        logger.info(`Stack is in rollback state (${stackStatus}). Waiting for rollback to complete...`);
        await awsUtils.waitForStack(stackName);
        
        // Get updated status after rollback
        const updatedStack = await cfn.describeStacks({ StackName: stackName });
        const updatedStatus = updatedStack.Stacks?.[0]?.StackStatus;
        logger.info(`Rollback completed. New status: ${updatedStatus}`);
      }
      
      // Check if stack is in a failed state that requires deletion
      if (stackStatus === 'ROLLBACK_COMPLETE' || 
          stackStatus === 'CREATE_FAILED' || 
          stackStatus === 'DELETE_FAILED' ||
          stackStatus === 'UPDATE_ROLLBACK_FAILED' ||
          stackStatus === 'UPDATE_ROLLBACK_COMPLETE') {
        logger.warning(`Stack is in failed state (${stackStatus}). Deleting and recreating...`);
        
        // Delete the failed stack
        await cfn.deleteStack({ StackName: stackName });
        logger.info('Waiting for stack deletion to complete...');
        await awsUtils.waitForStackDeletion(stackName);
        
        // Create new stack
        logger.info(`Creating new stack: ${stackName}`);
        await cfn.createStack(stackParams);
      } else if (stackStatus === 'ROLLBACK_IN_PROGRESS' || 
                 stackStatus === 'UPDATE_ROLLBACK_IN_PROGRESS') {
        // This case is already handled above, but let's get the final status
        const finalStack = await cfn.describeStacks({ StackName: stackName });
        const finalStatus = finalStack.Stacks?.[0]?.StackStatus;
        
        if (finalStatus === 'ROLLBACK_COMPLETE' || 
            finalStatus === 'UPDATE_ROLLBACK_COMPLETE') {
          logger.warning(`Stack rollback completed (${finalStatus}). Deleting and recreating...`);
          
          // Delete the failed stack
          await cfn.deleteStack({ StackName: stackName });
          logger.info('Waiting for stack deletion to complete...');
          await awsUtils.waitForStackDeletion(stackName);
          
          // Create new stack
          logger.info(`Creating new stack: ${stackName}`);
          await cfn.createStack(stackParams);
        } else {
          logger.info(`Updating existing stack: ${stackName}`);
          await cfn.updateStack(stackParams);
        }
      } else {
        logger.info(`Updating existing stack: ${stackName}`);
        await cfn.updateStack(stackParams);
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        logger.info(`Creating new stack: ${stackName}`);
        await cfn.createStack(stackParams);
      } else if (error.message?.includes('No updates are to be performed')) {
        logger.info('No updates required for CloudWatch Live stack');
        return;
      } else {
        throw error;
      }
    }

    // Wait for stack completion using polling
    logger.info('Waiting for stack operation to complete...');
    const success = await awsUtils.waitForStack(stackName);
    
    if (success) {
      logger.success('CloudWatch Live deployment completed successfully');
    } else {
      throw new Error('CloudWatch Live deployment failed');
    }

  } catch (error: any) {
    logger.error(`CloudWatch Live deployment failed: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);
    throw error;
  }
}
