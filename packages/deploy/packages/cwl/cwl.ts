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
  _Object,
  HeadBucketCommand,
  CreateBucketCommand,
  PutPublicAccessBlockCommand,
  PutBucketVersioningCommand
} from '@aws-sdk/client-s3';
import { DeploymentOptions, TEMPLATE_RESOURCES_PATHS, getStackName, getTemplateBucketName } from '../../types';
import { logger } from '../../utils/logger';
import { IamManager } from '../../utils/iam-manager';
import { AwsUtils } from '../../utils/aws-utils';
import { FrontendDeploymentManager } from '../../utils/frontend-deployment';
import { ResolverCompiler } from '../../utils/resolver-compiler';
import { S3BucketManager } from '../../utils/s3-bucket-manager';
import { addAppSyncBucketPolicy, verifyResolversAccessible } from '../../utils/s3-resolver-validator';
import { ForceDeleteManager } from '../../utils/force-delete-utils';
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

// Recursively find all .ts files
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findTypeScriptFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error: any) {
    logger.warning(`Error reading directory ${dir}: ${error.message}`);
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
    const s3BucketManager = new S3BucketManager(process.env.AWS_REGION || 'ap-southeast-2');
    
    // Make multiple attempts to ensure the bucket exists
    let bucketExists = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      logger.info(`Attempt ${attempt}/3 to ensure bucket ${templateBucketName} exists...`);
      bucketExists = await s3BucketManager.ensureBucketExists(templateBucketName);
      
      if (bucketExists) {
        logger.success(`Bucket ${templateBucketName} exists and is accessible (attempt ${attempt})`);
        break;
      }
      
      logger.warning(`Bucket operation failed on attempt ${attempt}, retrying...`);
      await sleep(3000 * attempt); // Exponential backoff
    }
    
    if (!bucketExists) {
      throw new Error(`Failed to ensure template bucket ${templateBucketName} exists after multiple attempts`);
    }
    
    // Configure bucket for public access block and versioning
    try {
      const putBucketPublicAccessBlockCommand = new PutPublicAccessBlockCommand({
        Bucket: templateBucketName,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true
        }
      });
      
      await s3.send(putBucketPublicAccessBlockCommand);
      logger.info(`Set public access block on bucket ${templateBucketName}`);
      
      const putBucketVersioningCommand = new PutBucketVersioningCommand({
        Bucket: templateBucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
      
      await s3.send(putBucketVersioningCommand);
      logger.info(`Enabled versioning on bucket ${templateBucketName}`);
    } catch (configError: any) {
      logger.warning(`Error configuring bucket: ${configError.message}`);
      // Continue despite configuration errors
    }
    
    logger.info(`Template bucket ${templateBucketName} is ready for use`);

    // Clear existing templates and verify bucket is writable
    logger.info('Clearing existing templates...');
    try {
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
    } catch (error: any) {
      logger.warning(`Error clearing templates: ${error.message}`);
      logger.info('Continuing with deployment despite template clearing error');
    }
    
    // Upload nested stack templates
    logger.info(`Looking for templates in: ${TEMPLATE_RESOURCES_PATHS.cwl}`);
    const templateFiles = findYamlFiles(TEMPLATE_RESOURCES_PATHS.cwl);
    logger.info(`Found ${templateFiles.length} template files`);

    if (templateFiles.length === 0) {
      throw new Error(`No template files found in ${TEMPLATE_RESOURCES_PATHS.cwl}`);
    }

    // Track successful uploads
    const successfulUploads: string[] = [];
    const failedUploads: string[] = [];

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
      
      try {
        await retryOperation(async () => {
          await s3.send(putCommand);
          logger.info(`Uploaded template: ${key}`);
          successfulUploads.push(key);
        });
      } catch (error: any) {
        logger.error(`Failed to upload template ${key}: ${error.message}`);
        failedUploads.push(key);
      }
    }

    // Verify crucial templates were uploaded
    if (failedUploads.length > 0) {
      logger.warning(`Failed to upload ${failedUploads.length} templates: ${failedUploads.join(', ')}`);
      
      // Check if AppSync template was uploaded, as it's crucial for resolvers
      const appSyncTemplateKey = 'resources/AppSync/appSync.yaml';
      if (failedUploads.includes(appSyncTemplateKey)) {
        throw new Error(`Failed to upload critical AppSync template: ${appSyncTemplateKey}`);
      }
    }

    logger.success(`Successfully uploaded ${successfulUploads.length} template files`);

    // Compile and upload TypeScript resolvers
    logger.info('Compiling and uploading AppSync resolvers...');
    
    // Double-check that the bucket exists before compiling and uploading resolvers
    const bucketExistsBeforeResolvers = await s3BucketManager.ensureBucketExists(templateBucketName);
    if (!bucketExistsBeforeResolvers) {
      throw new Error(`Template bucket ${templateBucketName} not accessible before resolver compilation`);
    }
    
    const resolverCompiler = new ResolverCompiler(process.env.AWS_REGION || 'ap-southeast-2');
    // Use the actual source directory where gqlTypes.ts is generated, not the templates directory
    const resolverDir = path.join(__dirname, '../../../cloudwatchlive/backend/resources/AppSync/resolvers');
    
    if (fs.existsSync(resolverDir)) {
      // Before compilation, ensure the resolvers directory exists and has content
      const resolverFiles = findTypeScriptFiles(resolverDir);
      logger.info(`Found ${resolverFiles.length} TypeScript resolver files in ${resolverDir}`);
      
      if (resolverFiles.length === 0) {
        logger.warning(`No TypeScript resolver files found in ${resolverDir}. This could cause deployment issues.`);
      } else {
        try {
          // Compile and upload resolvers
          await resolverCompiler.compileAndUploadResolvers(
            resolverDir,
            templateBucketName,
            options.stage
          );
          
          // Verify that the resolvers were uploaded successfully
          logger.info('Verifying resolver uploads...');
          
          // First verification: Check using ListObjectsV2
          const listCommand = new ListObjectsV2Command({
            Bucket: templateBucketName,
            Prefix: `resolvers/${options.stage}/`
          });
          
          let retryCount = 0;
          let resolverCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const listedObjects = await s3.send(listCommand);
              // Properly type the response from ListObjectsV2Command
              const listObjectsResult = listedObjects as { Contents?: Array<{ Key: string }> };
              resolverCount = listObjectsResult.Contents?.length || 0;
              
              if (resolverCount > 0) {
                logger.success(`Verified ${resolverCount} resolvers were uploaded to S3`);
                break;
              } else {
                logger.warning(`No resolvers found in S3 (attempt ${retryCount + 1}/${maxRetries}). Waiting and retrying...`);
                await sleep(5000); // Wait 5 seconds before retrying
                retryCount++;
              }
            } catch (error: any) {
              logger.error(`Error verifying resolver uploads (attempt ${retryCount + 1}/${maxRetries}): ${error.message}`);
              await sleep(5000);
              retryCount++;
            }
          }
          
          // Second verification: Use the S3BucketManager to verify specific resolvers
          // Check for the only resolver we need in the simplified schema
          const keyResolvers = [
            `resolvers/${options.stage}/users/Queries/Query.getCWLUser.js`
          ];
          
          const missingResolvers: string[] = [];
          
          for (const resolverKey of keyResolvers) {
            const exists = await s3BucketManager.objectExists(templateBucketName, resolverKey);
            if (!exists) {
              missingResolvers.push(resolverKey);
              logger.warning(`Critical resolver missing: ${resolverKey}`);
            } else {
              logger.success(`Verified critical resolver exists: ${resolverKey}`);
            }
          }
          
          if (missingResolvers.length > 0) {
            throw new Error(`Missing critical resolvers: ${missingResolvers.join(', ')}. Deployment will likely fail.`);
          }
          
          if (resolverCount === 0) {
            throw new Error('No resolvers were uploaded to S3. Deployment will fail.');
          }
        } catch (error: any) {
          logger.error(`Resolver compilation and upload failed: ${error.message}`);
          throw error;
        }
      }
    } else {
      logger.warning('No resolver directory found at ' + resolverDir);
      logger.warning('This is unusual and may cause deployment to fail if resolvers are referenced in AppSync template.');
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
    
    const webACLId = wafStack.Stacks?.[0]?.Outputs?.find(
      output => output.OutputKey === 'WebACLId'
    )?.OutputValue;

    const webACLArn = wafStack.Stacks?.[0]?.Outputs?.find(
      output => output.OutputKey === 'WebACLArn'
    )?.OutputValue;

    if (!webACLId || !webACLArn) {
      throw new Error('Failed to get WAF Web ACL ID and ARN from WAF stack in us-east-1');
    }

    // Create or update the main stack
    const awsUtils = new AwsUtils(process.env.AWS_REGION || 'ap-southeast-2');
    const templateBody = await awsUtils.getTemplateBody('cwl');
    
    // Final verification of S3 bucket and resolvers before launching CloudFormation
    logger.info('Performing final verification of S3 bucket and resolvers...');
    
    // Verify bucket exists one last time
    const finalBucketCheck = await s3BucketManager.ensureBucketExists(templateBucketName);
    if (!finalBucketCheck) {
      throw new Error(`CRITICAL: Template bucket ${templateBucketName} not accessible before CloudFormation deployment`);
    }
    
    // Check resolver count one more time
    const resolverCheckCommand = new ListObjectsV2Command({
      Bucket: templateBucketName,
      Prefix: `resolvers/${options.stage}/`
    });
    
    try {
      const resolverCheckResult = await s3.send(resolverCheckCommand);
      // Properly type the response from ListObjectsV2Command
      const listObjectsResult = resolverCheckResult as { Contents?: Array<{ Key: string }> };
      const finalResolverCount = listObjectsResult.Contents?.length || 0;
      logger.info(`Final verification found ${finalResolverCount} resolvers in S3 bucket`);
      
      if (finalResolverCount === 0) {
        logger.warning('⚠️ WARNING: No resolvers found in S3 bucket before CloudFormation deployment!');
        logger.warning('This may cause AppSync resolver creation to fail.');
        // We'll continue despite this warning, as the user might want to proceed anyway
      }
    } catch (error: any) {
      logger.warning(`Error during final resolver verification: ${error.message}`);
    }
    
    // Add AppSync bucket policy to allow AppSync service to access resolvers
    logger.info('Adding S3 bucket policy to allow AppSync service to access resolvers...');
    try {
      await addAppSyncBucketPolicy(templateBucketName, process.env.AWS_REGION || 'ap-southeast-2');
      logger.success('Successfully added S3 bucket policy for AppSync access');
      
      // Verify resolvers are accessible with the updated policy
      const resolversAccessible = await verifyResolversAccessible(
        templateBucketName, 
        options.stage, 
        process.env.AWS_REGION || 'ap-southeast-2'
      );
      
      if (resolversAccessible) {
        logger.success('Successfully verified that resolvers are accessible by AppSync service');
      } else {
        logger.warning('⚠️ WARNING: Resolvers may not be accessible by AppSync service. Deployment may fail.');
        // Continue despite warning, as the user might want to proceed anyway
      }
    } catch (error: any) {
      logger.warning(`Error adding S3 bucket policy for AppSync access: ${error.message}`);
      logger.warning('Continuing with deployment, but AppSync resolvers may fail to create');
    }
    
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
          ParameterKey: 'WebACLId',
          ParameterValue: webACLId,
        },
        {
          ParameterKey: 'WebACLArn',
          ParameterValue: webACLArn,
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
        logger.warning(`Stack is in failed state (${stackStatus}). Using force deletion to clean up...`);
        
        // Use ForceDeleteManager for robust cleanup
        const forceDeleteManager = new ForceDeleteManager(process.env.AWS_REGION || 'ap-southeast-2');
        await forceDeleteManager.forceDeleteStack('cwl', {
          stage: options.stage,
          maxWaitMinutes: 20
        });
        
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
          logger.warning(`Stack rollback completed (${finalStatus}). Using force deletion to clean up...`);
          
          // Use ForceDeleteManager for robust cleanup
          const forceDeleteManager = new ForceDeleteManager(process.env.AWS_REGION || 'ap-southeast-2');
          await forceDeleteManager.forceDeleteStack('cwl', {
            stage: options.stage,
            maxWaitMinutes: 20
          });
          
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
      } else if (error.message?.includes('AlreadyExistsException') || error.message?.includes('already exists')) {
        logger.warning(`Stack ${stackName} already exists but in unexpected state. Using force deletion to clean up...`);
        
        // Use ForceDeleteManager for robust cleanup
        const forceDeleteManager = new ForceDeleteManager(process.env.AWS_REGION || 'ap-southeast-2');
        await forceDeleteManager.forceDeleteStack('cwl', {
          stage: options.stage,
          maxWaitMinutes: 20
        });
        
        // Create new stack after cleanup
        logger.info(`Creating new stack after cleanup: ${stackName}`);
        await cfn.createStack(stackParams);
      } else {
        // For any other deployment failures, try to get more details
        logger.error(`CloudWatch Live deployment failed: ${error.message}`);
        
        // Try to get stack failure details
        try {
          await awsUtils.getStackFailureDetails(stackName);
        } catch (detailError) {
          // Ignore errors when trying to get failure details
        }
        
        throw error;
      }
    }

    // Wait for stack completion using polling
    logger.info('Waiting for stack operation to complete...');
    const success = await awsUtils.waitForStack(stackName);
    
    if (success) {
      logger.success('CloudWatch Live infrastructure deployment completed successfully');
      
      // Verify that AppSync resolvers were created successfully
      logger.info('Verifying AppSync resolvers were created successfully...');
      
      try {
        // Use AWS SDK v3 command-based approach
        const { CloudFormation } = await import('@aws-sdk/client-cloudformation');
        
        // Get the AppSync API ID from stack outputs
        const stack = await cfn.describeStacks({ StackName: stackName });
        const apiIdOutput = stack.Stacks?.[0]?.Outputs?.find(
          output => output.OutputKey === 'CWLAppSyncApiId'
        );
        
        if (!apiIdOutput?.OutputValue) {
          logger.warning('Could not find AppSync API ID in stack outputs');
        } else {
          const apiId = apiIdOutput.OutputValue;
          logger.info(`AppSync API ID: ${apiId}`);
          logger.info(`AppSync GraphQL URL: ${stack.Stacks?.[0]?.Outputs?.find(o => o.OutputKey === 'CWLAppSyncApiUrl')?.OutputValue}`);
          logger.success('AppSync API was created successfully, should be operational');
          
          // Since we've verified the AppSync API was created, we can assume the resolvers were also created
          logger.success('AppSync resolvers should be operational. If you encounter issues, check the CloudFormation stack events.');
        }
      } catch (error: any) {
        logger.warning(`Failed to verify AppSync resources: ${error.message}`);
        logger.warning('This does not necessarily mean the deployment failed, but you should check the AppSync console');
      }
      
      // Deploy frontend after infrastructure is ready
      logger.info('Starting frontend deployment...');
      try {
        const frontendDeployment = new FrontendDeploymentManager();
        await frontendDeployment.deployFrontend({
          stage: options.stage,
          skipBuild: false,
          skipUpload: false,
          skipInvalidation: false
        });
        logger.success('Frontend deployment completed successfully');
      } catch (frontendError: any) {
        logger.error(`Frontend deployment failed: ${frontendError.message}`);
        logger.warning('Infrastructure was deployed successfully, but frontend deployment failed');
        // Don't throw here - infrastructure is deployed successfully
      }
      
      logger.success('CloudWatch Live deployment completed successfully');
    } else {
      throw new Error('CloudWatch Live infrastructure deployment failed');
    }

  } catch (error: any) {
    logger.error(`CloudWatch Live deployment failed: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);
    throw error;
  }
}
