// Minimal script to deploy CWL without depending on the existing cwl.ts file
import { logger } from './utils/logger';
import { ForceDeleteManager } from './utils/force-delete-utils';
import { StackType } from './types';
import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import path from 'path';
import { CloudFormation, Capability, Parameter } from '@aws-sdk/client-cloudformation';
import { S3, BucketLocationConstraint } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';

// Find YAML template files
function findYamlFiles(dir: string): string[] {
  const files: string[] = [];
  const entriesSync = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entriesSync) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findYamlFiles(fullPath));
    } else if (
      entry.isFile() && 
      (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
    ) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function deployCwlStack() {
  const stage = 'dev';
  const region = process.env.AWS_REGION || 'ap-southeast-2';
  
  logger.info(`Deploying CWL stack in region ${region}, stage ${stage}`);
  
  try {
    // Initialize clients
    const s3 = new S3({ region });
    const cfn = new CloudFormation({ region });
    
    // Create template bucket if it doesn't exist
    const templateBucketName = `nlmonorepo-cwl-templates-${stage}`;
    try {
      await s3.createBucket({
        Bucket: templateBucketName,
        CreateBucketConfiguration: {
          LocationConstraint: region === 'us-east-1' ? undefined : region as BucketLocationConstraint
        }
      });
      logger.info(`Created template bucket: ${templateBucketName}`);
    } catch (error: unknown) {
      // Type guard for error name (assuming error is an object with a name property)
      if (typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name !== 'BucketAlreadyOwnedByYou') {
        logger.warning(`Bucket creation error: ${(error as { message?: string }).message}`);
      } else {
        logger.info(`Template bucket already exists: ${templateBucketName}`);
      }
    }
    
    // Upload CloudFormation templates to S3
    const templatesDir = path.join(__dirname, 'templates', 'cwl');
    logger.info(`Looking for templates in: ${templatesDir}`);
    
    const templateFiles = findYamlFiles(templatesDir);
    logger.info(`Found ${templateFiles.length} template files`);
    
    for (const file of templateFiles) {
      const relativePath = path.relative(templatesDir, file);
      const key = `${relativePath}`;
      
      try {
        await s3.putObject({
          Bucket: templateBucketName,
          Key: key,
          Body: createReadStream(file),
          ContentType: 'application/x-yaml'
        });
        logger.info(`Uploaded template: ${key}`);
      } catch (error: unknown) {
        logger.error(`Failed to upload ${file}: ${(error as Error).message}`);
        throw error;
      }
    }
    
    // Deploy main stack
    const stackName = `nlmonorepo-cwl-${stage}`;
    
    // Read main template
    const mainTemplatePath = path.join(templatesDir, 'cfn-template.yaml');
    const templateBody = await fsPromises.readFile(mainTemplatePath, 'utf8');
    
    // Get WAF outputs
    let webAclId = '';
    let webAclArn = '';
    
    try {
      const wafCfn = new CloudFormation({ region: 'us-east-1' });
      const wafStack = await wafCfn.describeStacks({
        StackName: `nlmonorepo-waf-${stage}`
      });
      
      webAclId = wafStack.Stacks?.[0]?.Outputs?.find(
        output => output.OutputKey === 'WebACLId'
      )?.OutputValue || '';
      
      webAclArn = wafStack.Stacks?.[0]?.Outputs?.find(
        output => output.OutputKey === 'WebACLArn'
      )?.OutputValue || '';
      
      logger.info(`Found WAF WebACLId: ${webAclId}`);
      logger.info(`Found WAF WebACLArn: ${webAclArn}`);
    } catch (error: unknown) {
      logger.warning(`Could not get WAF stack outputs: ${(error as Error).message}`);
      logger.warning('Continuing without WAF integration');
    }
    
    // Get KMS key outputs
    let kmsKeyId = '';
    let kmsKeyArn = '';
    
    try {
      const sharedStack = await cfn.describeStacks({
        StackName: `nlmonorepo-shared-${stage}`
      });
      
      kmsKeyId = sharedStack.Stacks?.[0]?.Outputs?.find(
        output => output.OutputKey === 'KMSKeyId'
      )?.OutputValue || '';
      
      kmsKeyArn = sharedStack.Stacks?.[0]?.Outputs?.find(
        output => output.OutputKey === 'KMSKeyArn'
      )?.OutputValue || '';
      
      logger.info(`Found KMS KeyId: ${kmsKeyId}`);
      logger.info(`Found KMS KeyArn: ${kmsKeyArn}`);
    } catch (error: unknown) {
      logger.warning(`Could not get shared stack outputs: ${(error as Error).message}`);
      logger.warning('Continuing without KMS encryption');
    }
    
    // Create or update stack
    const stackParams = {
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        {
          ParameterKey: 'Stage',
          ParameterValue: stage,
        },
        {
          ParameterKey: 'TemplateBucketName',
          ParameterValue: templateBucketName,
        }
      ] as Parameter[],
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'] as Capability[]
    };
    
    // Add KMS and WAF parameters if available
    if (kmsKeyId) {
      stackParams.Parameters.push({
        ParameterKey: 'KMSKeyId',
        ParameterValue: kmsKeyId,
      });
    }
    
    if (kmsKeyArn) {
      stackParams.Parameters.push({
        ParameterKey: 'KMSKeyArn',
        ParameterValue: kmsKeyArn,
      });
    }
    
    if (webAclId) {
      stackParams.Parameters.push({
        ParameterKey: 'WebAclId',
        ParameterValue: webAclId,
      });
    }
    
    if (webAclArn) {
      stackParams.Parameters.push({
        ParameterKey: 'WebAclArn',
        ParameterValue: webAclArn,
      });
    }
    
    try {
      // Check if stack exists and its status
      const existingStack = await cfn.describeStacks({ StackName: stackName });
      const stackStatus = existingStack.Stacks?.[0]?.StackStatus;
      
      // Check if stack is in a failed state that requires force deletion
      const failedStates = [
        'ROLLBACK_COMPLETE',
        'CREATE_FAILED', 
        'DELETE_FAILED',
        'UPDATE_ROLLBACK_FAILED',
        'UPDATE_ROLLBACK_COMPLETE'
      ];
      
      if (stackStatus && failedStates.includes(stackStatus)) {
        logger.warning(`Stack ${stackName} is in failed state: ${stackStatus}. Using force deletion to clean up...`);
        
        const forceDeleteManager = new ForceDeleteManager(region);
        await forceDeleteManager.forceDeleteStack('cwl', StackType.CWL, stage);
        
        // Create new stack after cleanup
        logger.info(`Creating new stack after cleanup: ${stackName}`);
        await cfn.createStack(stackParams);
      } else {
        // Update existing stack
        logger.info(`Updating stack: ${stackName}`);
        await cfn.updateStack(stackParams);
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error).message;
      if (errorMessage?.includes('does not exist')) {
        // Create new stack
        logger.info(`Creating new stack: ${stackName}`);
        await cfn.createStack(stackParams);
      } else if (errorMessage?.includes('No updates are to be performed')) {
        logger.info('No updates required for stack');
        return;
      } else if (errorMessage?.includes('AlreadyExistsException') || errorMessage?.includes('already exists')) {
        logger.warning(`Stack ${stackName} already exists but in unexpected state. Using force deletion to clean up...`);
        
        const forceDeleteManager = new ForceDeleteManager(region);
        await forceDeleteManager.forceDeleteStack('cwl', StackType.CWL, stage);
        
        // Create new stack after cleanup
        logger.info(`Creating new stack after cleanup: ${stackName}`);
        await cfn.createStack(stackParams);
      } else {
        throw error;
      }
    }
    
    // Wait for stack creation/update to complete
    logger.info('Waiting for stack operation to complete...');
    
    let stackComplete = false;
    let stackFailed = false;
    let attempts = 0;
    
    while (!stackComplete && !stackFailed && attempts < 60) {
      attempts++;
      
      try {
        const result = await cfn.describeStacks({ StackName: stackName });
        const status = result.Stacks?.[0]?.StackStatus;
        
        logger.info(`Stack status: ${status} (attempt ${attempts}/60)`);
        
        if (status?.endsWith('COMPLETE') && !status?.includes('ROLLBACK')) {
          stackComplete = true;
        } else if (status?.includes('FAILED') || status?.includes('ROLLBACK')) {
          stackFailed = true;
        } else {
          // Wait before checking again
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      } catch (error: unknown) {
        logger.warning(`Error checking stack status: ${(error as Error).message}`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    if (stackComplete) {
      logger.success(`Stack ${stackName} deployed successfully`);
      
      // Get stack outputs
      const outputs = await cfn.describeStacks({ StackName: stackName });
      const stackOutputs = outputs.Stacks?.[0]?.Outputs;
      
      if (stackOutputs?.length) {
        logger.info('Stack outputs:');
        for (const output of stackOutputs) {
          logger.info(`  ${output.OutputKey}: ${output.OutputValue}`);
        }
      }
    } else if (stackFailed) {
      logger.error(`Stack ${stackName} deployment failed`);
      
      // Get stack events to see what failed
      const events = await cfn.describeStackEvents({ StackName: stackName });
      const failedEvents = events.StackEvents?.filter(event => 
        event.ResourceStatus?.includes('FAILED')
      );
      
      if (failedEvents?.length) {
        logger.error('Failed resources:');
        for (const event of failedEvents) {
          logger.error(`  ${event.LogicalResourceId}: ${event.ResourceStatusReason}`);
        }
      }
      
      // Offer force deletion and retry option
      logger.warning('Attempting automatic cleanup with force deletion...');
      try {
        const forceDeleteManager = new ForceDeleteManager(region);
        await forceDeleteManager.forceDeleteStack('cwl', StackType.CWL, stage);
        
        logger.info('Failed stack cleaned up. You can retry deployment.');
      } catch (cleanupError: unknown) {
        logger.error(`Cleanup failed: ${(cleanupError as Error).message}`);
      }

      throw new Error('Stack deployment failed');
    } else {
      logger.warning(`Stack operation timed out after ${attempts} attempts`);
      
      // Try to get current stack status for debugging
      try {
        const result = await cfn.describeStacks({ StackName: stackName });
        const finalStatus = result.Stacks?.[0]?.StackStatus;
        logger.warning(`Final stack status: ${finalStatus}`);
      } catch (statusError) {
        logger.warning('Could not retrieve final stack status');
      }
      
      throw new Error('Stack operation timed out');
    }
    
    return true;
  } catch (error: any) {
    logger.error(`Deployment failed: ${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

// Run the deployment
deployCwlStack()
  .then(() => {
    logger.success('Deployment completed successfully');
    process.exit(0);
  })
  .catch(error => { // This error is from the promise chain, can be Error
    logger.error(`Deployment failed: ${(error as Error).message}`);
    process.exit(1);
  });
