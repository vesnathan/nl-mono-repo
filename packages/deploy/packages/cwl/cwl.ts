import { 
  CloudFormationClient,
  Parameter,
  Capability,
  CreateStackCommand,
  UpdateStackCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  DeleteStackCommand,
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
  PutBucketVersioningCommand,
  Tag
} from '@aws-sdk/client-s3';
import { DeploymentOptions, StackType, TEMPLATE_RESOURCES_PATHS, getStackName, getTemplateBucketName, TEMPLATE_PATHS } from '../../types';
import { logger } from '../../utils/logger';
import { IamManager } from '../../utils/iam-manager';
import { AwsUtils } from '../../utils/aws-utils';
import { FrontendDeploymentManager } from '../../utils/frontend-deployment';
import { ResolverCompiler } from '../../utils/resolver-compiler';
import { S3BucketManager } from '../../utils/s3-bucket-manager';
import { addAppSyncBucketPolicy, verifyResolversAccessible } from '../../utils/s3-resolver-validator';
import { ForceDeleteManager } from '../../utils/force-delete-utils';
import { OutputsManager } from '../../outputs-manager';
import { createReadStream, readdirSync, statSync, existsSync } from 'fs';
import * as path from 'path';

const findYamlFiles = (dir: string): string[] => {
  const files = readdirSync(dir);
  let yamlFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
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
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      logger.warning(`Operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
      await sleep(RETRY_DELAY * attempt);
    }
  }
  throw new Error('Unexpected: Should not reach here');
}

// Recursively find all .ts files
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
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

// Helper function to handle stuck stack resources
async function handleStuckStackResources(stackName: string): Promise<void> {
  logger.debug(`Attempting manual cleanup of stuck resources in stack: ${stackName}`);
  
  try {
    const cfn = new CloudFormationClient({ region: 'ap-southeast-2' });
    
    // List all stack resources to find stuck ones
    const response = await cfn.send(new DescribeStackResourcesCommand({ StackName: stackName }));
    const StackResources = response.StackResources;
    
    if (StackResources) {
      for (const resource of StackResources) {
        if (resource.ResourceStatus === 'DELETE_FAILED' && resource.ResourceType === 'AWS::IAM::Role') {
          logger.debug(`Found stuck IAM role: ${resource.LogicalResourceId} (${resource.PhysicalResourceId})`);
          
          // Try to manually delete the IAM role
          if (resource.PhysicalResourceId) {
            await cleanupIAMRole(resource.PhysicalResourceId);
          }
        }
        
        if (resource.ResourceStatus === 'DELETE_FAILED' && resource.ResourceType === 'AWS::CloudFormation::Stack') {
          logger.debug(`Found stuck nested stack: ${resource.LogicalResourceId} (${resource.PhysicalResourceId})`);
          
          // Try to force delete the nested stack
          if (resource.PhysicalResourceId) {
            await cleanupNestedStack(resource.PhysicalResourceId);
          }
        }
      }
    }
    
    // Wait a bit for AWS to process the manual cleanup
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error: any) {
    logger.warning(`Manual resource cleanup failed: ${error.message}`);
  }
}

// Helper function to cleanup IAM roles
async function cleanupIAMRole(roleArn: string): Promise<void> {
  try {
    const { IAMClient, DetachRolePolicyCommand, ListAttachedRolePoliciesCommand, DeleteRoleCommand } = await import('@aws-sdk/client-iam');
    const iam = new IAMClient({ region: 'ap-southeast-2' });
    
    // Extract role name from ARN
    const roleName = roleArn.split('/').pop();
    if (!roleName) {
      logger.warning(`Could not extract role name from ARN: ${roleArn}`);
      return;
    }
    
    logger.debug(`Attempting to cleanup IAM role: ${roleName}`);
    
    // First, detach all policies
    const { AttachedPolicies } = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
    
    if (AttachedPolicies) {
      for (const policy of AttachedPolicies) {
        if (policy.PolicyArn) {
          logger.debug(`Detaching policy ${policy.PolicyArn} from role ${roleName}`);
          await iam.send(new DetachRolePolicyCommand({
            RoleName: roleName,
            PolicyArn: policy.PolicyArn
          }));
        }
      }
    }
    
    // Then delete the role
    logger.debug(`Deleting IAM role: ${roleName}`);
    await iam.send(new DeleteRoleCommand({ RoleName: roleName }));
    logger.success(`Successfully deleted IAM role: ${roleName}`);
    
  } catch (error: any) {
    logger.warning(`Failed to cleanup IAM role ${roleArn}: ${error.message}`);
  }
}

// Helper function to cleanup nested stacks
async function cleanupNestedStack(stackArn: string): Promise<void> {
  try {
    const cfn = new CloudFormationClient({ region: 'ap-southeast-2' });
    
    // Extract the actual stack name from the ARN
    // ARN format: arn:aws:cloudformation:region:account:stack/stack-name/uuid
    const arnParts = stackArn.split('/');
    if (arnParts.length < 2) {
      logger.warning(`Invalid stack ARN format: ${stackArn}`);
      return;
    }
    
    const fullStackName = arnParts[1]; // This is the complete stack name
    logger.debug(`Attempting to force delete nested stack: ${fullStackName}`);
    
    // Try direct deletion first
    try {
      await cfn.send(new DeleteStackCommand({ StackName: fullStackName }));
      logger.debug(`Initiated deletion of nested stack: ${fullStackName}`);
      
      // Wait for deletion to complete
      await waitForStackDeletion(cfn, fullStackName);
      logger.success(`Successfully cleaned up nested stack: ${fullStackName}`);
    } catch (deleteError: any) {
      logger.warning(`Direct deletion failed for ${fullStackName}: ${deleteError.message}`);
      
      // Try force deletion as fallback
      const forceDeleteManager = new ForceDeleteManager('ap-southeast-2');
      await forceDeleteManager.forceDeleteStack(fullStackName, StackType.CWL, 'dev');
      logger.success(`Force deleted nested stack: ${fullStackName}`);
    }
    
  } catch (error: any) {
    logger.warning(`Failed to cleanup nested stack ${stackArn}: ${error.message}`);
  }
}

// Helper function to wait for stack deletion
async function waitForStackDeletion(cfn: CloudFormationClient, stackName: string): Promise<void> {
  const maxAttempts = 120; // Increased from 30 to 120 (20 minutes)
  const delay = 10000; // 10 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
      const stack = response.Stacks?.[0];
      
      if (!stack) {
        logger.debug(`Stack ${stackName} no longer exists - deletion complete`);
        return;
      }
      
      const status = stack.StackStatus;
      if (status === 'DELETE_COMPLETE') {
        logger.debug(`Stack ${stackName} deletion completed successfully`);
        return;
      }
      
      if (status === 'DELETE_FAILED') {
        throw new Error(`Stack ${stackName} deletion failed with status: ${status}`);
      }
      
      logger.debug(`Waiting for ${stackName} deletion... Status: ${status} (${i + 1}/${maxAttempts}) - ${Math.round((i + 1) / maxAttempts * 100)}% complete`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error: any) {
      if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
        logger.debug(`Stack ${stackName} no longer exists - deletion complete`);
        return;
      }
      
      if (i === maxAttempts - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Timeout waiting for stack ${stackName} deletion after ${maxAttempts * delay / 1000} seconds`);
}

export async function deployCwl(options: DeploymentOptions): Promise<void> {
  const stackName = getStackName(StackType.CWL, options.stage);
  const templateBucketName = getTemplateBucketName(StackType.CWL, options.stage);

  const stopSpinner = logger.infoWithSpinner('Starting CloudWatch Live stack deployment in ap-southeast-2');

  const region = options.region || process.env.AWS_REGION || 'ap-southeast-2';

  // Initialize clients
  const cfn = new CloudFormationClient({ region });
  const s3 = new S3({ region });
  const awsUtils = new AwsUtils(region);
  
  // Set up IAM role
  const iamManager = new IamManager(region); // Pass region string to IamManager
  const roleArn = await iamManager.setupRole(StackType.CWL, options.stage, templateBucketName);
  if (!roleArn) {
    throw new Error('Failed to setup role for CloudWatch Live');
  }

  try {
    // Create S3 bucket for templates if it doesn't exist
    const s3BucketManager = new S3BucketManager(region);
    
    // Make multiple attempts to ensure the bucket exists
    let bucketExists = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (options.debugMode) {
        logger.debug(`Attempt ${attempt}/3 to ensure bucket ${templateBucketName} exists...`);
      }
      bucketExists = await s3BucketManager.ensureBucketExists(templateBucketName);
      
      if (bucketExists) {
        logger.debug(`Bucket ${templateBucketName} exists and is accessible (attempt ${attempt})`);
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
      if (options.debugMode) {
        logger.debug(`Set public access block on bucket ${templateBucketName}`);
      }
      
      const putBucketVersioningCommand = new PutBucketVersioningCommand({
        Bucket: templateBucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
      
      await s3.send(putBucketVersioningCommand);
      if (options.debugMode) {
        logger.debug(`Enabled versioning on bucket ${templateBucketName}`);
      }
    } catch (configError: any) {
      logger.warning(`Error configuring bucket: ${configError.message}`);
      // Continue despite configuration errors
    }
    
    if (options.debugMode) {
      logger.debug(`Template bucket ${templateBucketName} is ready for use`);
    }

    // Upload main CloudFormation template
    const mainTemplateS3Key = 'cfn-template.yaml';
    const templateUrl = `https://s3.${region}.amazonaws.com/${templateBucketName}/${mainTemplateS3Key}`;

    if (options.debugMode) {
      logger.debug(`Uploading main template to s3://${templateBucketName}/${mainTemplateS3Key}`);
    }
    try {
        await s3.send(new PutObjectCommand({
            Bucket: templateBucketName,
            Key: mainTemplateS3Key,
            Body: createReadStream(TEMPLATE_PATHS[StackType.CWL]),
            ContentType: 'application/x-yaml',
        }));
        logger.debug('Main template uploaded successfully.');
    } catch (error: any) {
        throw new Error(`Failed to upload main template: ${error.message}`);
    }

    // Clear existing templates and verify bucket is writable
    if (options.debugMode) {
      logger.debug('Clearing existing templates...');
    }
    try {
      const listCommand = new ListObjectsV2Command({ 
        Bucket: templateBucketName, 
        Prefix: 'resources/' 
      });
      const existingObjects = await retryOperation(() => s3.send(listCommand));
      if (options.debugMode) {
        logger.debug(`Found ${existingObjects.Contents?.length || 0} existing objects to delete`);
      }
      
      if (existingObjects.Contents?.length) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: templateBucketName,
          Delete: {
            Objects: existingObjects.Contents.map((obj: _Object) => ({ Key: obj.Key! }))
          }
        });
        await retryOperation(() => s3.send(deleteCommand));
        if (options.debugMode) {
          logger.debug('Deleted existing templates');
        }
      }
    } catch (error: any) {
      logger.warning(`Error clearing templates: ${error.message}`);
      if (options.debugMode) {
        logger.debug('Continuing with deployment despite template clearing error');
      }
    }
    
    // Upload nested stack templates
    if (options.debugMode) {
      logger.debug(`Looking for templates in: ${TEMPLATE_RESOURCES_PATHS[StackType.CWL]}`);
    }
    const templateFiles = findYamlFiles(TEMPLATE_RESOURCES_PATHS[StackType.CWL]);
    if (options.debugMode) {
      logger.debug(`Found ${templateFiles.length} template files`);
    }

    if (templateFiles.length === 0) {
      throw new Error(`No template files found in ${TEMPLATE_RESOURCES_PATHS[StackType.CWL]}`);
    }

    // Track successful uploads
    const successfulUploads: string[] = [];
    const failedUploads: string[] = [];

    for (const file of templateFiles) {
      const relativePath = path.relative(TEMPLATE_RESOURCES_PATHS[StackType.CWL], file);
      const key = relativePath.replace(/\\/g, '/'); // Ensure forward slashes for S3
      if (options.debugMode) {
        logger.debug(`Uploading ${file} to ${key}`);
      }
      
      const putCommand = new PutObjectCommand({
        Bucket: templateBucketName,
        Key: key,
        Body: createReadStream(file),
        ContentType: 'application/x-yaml'
      });
      
      try {
        await retryOperation(async () => {
          await s3.send(putCommand);
          if (options.debugMode) {
            logger.debug(`Uploaded template: ${key}`);
          }
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

    logger.debug(`Successfully uploaded ${successfulUploads.length} template files`);

    // Compile and upload TypeScript resolvers
    if (options.debugMode) {
      logger.debug('Compiling and uploading AppSync resolvers...');
    }
    
    // Double-check that the bucket exists before compiling and uploading resolvers
    const bucketExistsBeforeResolvers = await s3BucketManager.ensureBucketExists(templateBucketName);
    if (!bucketExistsBeforeResolvers) {
      throw new Error(`Template bucket ${templateBucketName} not accessible before resolver compilation`);
    }
    
    const resolverDir = path.join(__dirname, '../../../cloudwatchlive/backend/resources/AppSync/resolvers');
    
    if (existsSync(resolverDir)) {
      // Find all resolver files in the specified directory
      const allFiles = findTypeScriptFiles(resolverDir);
      logger.debug(`Found ${allFiles.length} total TypeScript files in ${resolverDir}`);
      
      // Log all discovered files for debugging
      allFiles.forEach((file, index) => {
        logger.debug(`File ${index + 1}: ${file}`);
      });

      const resolverFiles = allFiles
        .filter(file => 
          !file.endsWith('.bak') && // Exclude backup files
          path.basename(file) !== 'gqlTypes.ts' && // Exclude the main types file
          file.includes(path.sep) // IMPORTANT: Only include files in subdirectories
        )
        .map(file => path.relative(resolverDir, file)); // Convert absolute paths to relative paths

      logger.debug(`After filtering, found ${resolverFiles.length} resolver files:`);
      resolverFiles.forEach((file, index) => {
        logger.debug(`Resolver ${index + 1}: ${file}`);
      });
      
      if (resolverFiles.length === 0) {
        logger.warning(`No TypeScript resolver files found in ${resolverDir}. This could cause deployment issues.`);
      } else {
        const resolverCompiler = new ResolverCompiler({
          baseResolverDir: resolverDir,
          localSaveDir: path.join(__dirname, '../../../deploy/packages/cwl/resolvers', options.stage),
          s3KeyPrefix: 'resolvers',
          stage: options.stage,
          s3BucketName: templateBucketName,
          region: region,
          resolverFiles: resolverFiles,
          sharedFileName: 'gqlTypes.ts'
        });

        try {
          // Compile and upload resolvers
          await resolverCompiler.compileAndUploadResolvers();
          
          // Verify that the resolvers were uploaded successfully
          if (options.debugMode) {
            logger.debug('Verifying resolver uploads...');
          }
          
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
                logger.debug(`Verified ${resolverCount} resolvers were uploaded to S3`);
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
          // Check for the resolvers we need in the schema
          const keyResolvers = [
            `resolvers/${options.stage}/users/Queries/Query.getCWLUser.js`,
            `resolvers/${options.stage}/users/Mutations/Mutation.createCWLUser.js`
          ];
          
          const missingResolvers: string[] = [];
          
          for (const resolverKey of keyResolvers) {
            const exists = await s3BucketManager.objectExists(templateBucketName, resolverKey);
            if (!exists) {
              missingResolvers.push(resolverKey);
              logger.warning(`Critical resolver missing: ${resolverKey}`);
            } else {
              logger.debug(`Verified critical resolver exists: ${resolverKey}`);
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
    const sharedStackData = await cfn.send(new DescribeStacksCommand({
      StackName: getStackName(StackType.Shared, options.stage)
    }));
    
    const kmsKeyId = sharedStackData.Stacks?.[0]?.Outputs?.find(
      output => output.OutputKey === 'KMSKeyId'
    )?.OutputValue;

    const kmsKeyArn = sharedStackData.Stacks?.[0]?.Outputs?.find(
      output => output.OutputKey === 'KMSKeyArn'
    )?.OutputValue;

    if (!kmsKeyId || !kmsKeyArn) {
      throw new Error('Failed to get KMS key information from shared stack');
    }

    // Use OutputsManager to get values from other stacks
    const outputsManager = new OutputsManager();
    
    // Get WAF Web ACL ID and ARN
    const webAclId = await outputsManager.getOutputValue(StackType.WAF, options.stage, 'WebACLId');
    const webAclArn = await outputsManager.getOutputValue(StackType.WAF, options.stage, 'WebACLArn');

    if (!webAclId || !webAclArn) {
      throw new Error('Failed to get WAF Web ACL information from WAF stack outputs');
    }

    // Get shared template bucket name from shared stack
    const sharedTemplateBucketName = await outputsManager.getOutputValue(StackType.Shared, options.stage, 'TemplateBucketName');
    
    if (!sharedTemplateBucketName) {
      throw new Error('Failed to get shared template bucket name from Shared stack outputs');
    }

    // Create or update the CloudFormation stack
    const stackTemplateUrl = `https://s3.${region}.amazonaws.com/${templateBucketName}/${mainTemplateS3Key}`;
    const stackParams: Parameter[] = [
      { ParameterKey: 'Stage', ParameterValue: options.stage },
      { ParameterKey: 'TemplatesBucketName', ParameterValue: templateBucketName },
      { ParameterKey: 'WebACLId', ParameterValue: webAclId },
      { ParameterKey: 'WebACLArn', ParameterValue: webAclArn },
      { ParameterKey: 'SharedTemplateBucketName', ParameterValue: sharedTemplateBucketName },
    ];

    try {
      // Check if the stack exists
      const describeResponse = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
      const stackExists = describeResponse.Stacks && describeResponse.Stacks.length > 0;

      if (stackExists) {
        logger.info('Updating existing CloudFormation stack...');
        await cfn.send(new UpdateStackCommand({
          StackName: stackName,
          TemplateURL: stackTemplateUrl,
          Parameters: stackParams,
          Capabilities: [Capability.CAPABILITY_NAMED_IAM],
          // Add other update options as needed
        }));
      } else {
        logger.info('Creating new CloudFormation stack...');
        await cfn.send(new CreateStackCommand({
          StackName: stackName,
          TemplateURL: stackTemplateUrl,
          Parameters: stackParams,
          Capabilities: [Capability.CAPABILITY_NAMED_IAM],
          // Add other create options as needed
        }));
      }

      logger.success(`CloudFormation stack ${stackName} deployed/updated successfully`);
    } catch (cfnError: any) {
      logger.error(`CloudFormation deployment failed: ${cfnError.message}`);
      throw cfnError;
    }
  } catch (error: any) {
    logger.error(`Deployment failed: ${error.message}`);
    throw error;
  } finally {
    stopSpinner();
  }
}
