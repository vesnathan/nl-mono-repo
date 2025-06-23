import { 
  CloudFormation, 
  waitUntilStackUpdateComplete,
  waitUntilStackCreateComplete,
  Parameter,
  Capability,
  Tag,
  CreateStackCommand,
  UpdateStackCommand
} from '@aws-sdk/client-cloudformation';
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { DeploymentOptions, getStackName, getTemplateBucketName, TEMPLATE_RESOURCES_PATHS, StackType } from '../../types';
import { logger } from '../../utils/logger';
import { AwsUtils } from '../../utils/aws-utils';
import { glob } from 'glob';
import { createReadStream } from 'fs';
import path from 'path';
import { IamManager } from '../../utils/iam-manager';

// WAF must be deployed in us-east-1
const WAF_REGION = 'us-east-1';

async function uploadWafTemplates(s3Client: S3Client, bucketName: string): Promise<void> {
  const templatesPath = TEMPLATE_RESOURCES_PATHS[StackType.WAF];
  logger.info(`Uploading WAF templates from ${templatesPath} to bucket ${bucketName}...`);

  try {
    const files = await glob(path.join(templatesPath, '**/*.yaml').replace(/\\/g, '/'));
    if (files.length === 0) {
      logger.warning(`No YAML templates found in ${templatesPath}. Ensure templates are present.`);
      return;
    }

    for (const file of files) {
      const relativePath = path.relative(templatesPath, file);
      const s3Key = relativePath.replace(/\\/g, '/');
      
      logger.info(`Uploading ${file} to s3://${bucketName}/${s3Key}`);
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: createReadStream(file),
        ContentType: 'application/x-yaml',
      }));
    }
    logger.success(`Successfully uploaded ${files.length} WAF templates.`);
  } catch (error) {
    logger.error(`Error uploading WAF templates: ${(error as Error).message}`);
    throw error;
  }
}

export async function deployWaf(options: DeploymentOptions): Promise<void> {
  const { stage } = options;
  const stackName = getStackName(StackType.WAF, stage);
  const templateBucketName = getTemplateBucketName(StackType.WAF, stage);
  const s3Client = new S3Client({ region: WAF_REGION });
  const awsUtils = new AwsUtils(WAF_REGION);

  logger.info(`Starting WAF stack deployment in ${WAF_REGION}`);

  // 1. Ensure the S3 bucket for templates exists
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: templateBucketName }));
    logger.success(`Successfully created or verified bucket: ${templateBucketName}`);
  } catch (error) {
    if ((error as Error).name === 'BucketAlreadyOwnedByYou' || (error as Error).name === 'BucketAlreadyExists') {
      logger.info(`Bucket ${templateBucketName} already exists.`);
    } else {
      logger.error(`Failed to create bucket ${templateBucketName}: ${(error as Error).message}`);
      throw error;
    }
  }

  // 2. Upload all WAF templates
  await uploadWafTemplates(s3Client, templateBucketName);

  // 3. Get the main template body (which will now be a URL)
  const mainTemplateKey = 'cfn-template.yaml';
  const templateUrl = `https://s3.amazonaws.com/${templateBucketName}/${mainTemplateKey}`;

  // 4. Get stack parameters
  const parameters: Parameter[] = [
    { ParameterKey: 'Stage', ParameterValue: stage },
    { ParameterKey: 'TemplateBucketName', ParameterValue: templateBucketName },
  ];

  // 5. Deploy the stack using TemplateURL
  const stackExists = await awsUtils.stackExists(stackName);
  
  const commandOptions = {
    StackName: stackName,
    TemplateURL: templateUrl,
    Parameters: parameters,
    Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'] as Capability[],
    Tags: [{ Key: 'Project', Value: 'CloudWatchLive' }] as Tag[],
  };

  const cfClient = awsUtils.getRegionalCfClient(WAF_REGION);

  if (stackExists) {
    logger.info(`Stack ${stackName} exists, updating...`);
    try {
      await cfClient.send(new UpdateStackCommand(commandOptions));
      await waitUntilStackUpdateComplete({ client: cfClient, maxWaitTime: 3600 }, { StackName: stackName });
      logger.success(`Stack ${stackName} updated successfully.`);
    } catch (error: any) {
      if (error.message.includes('No updates are to be performed')) {
        logger.info(`Stack ${stackName} is already up to date.`);
      } else {
        logger.error(`Failed to update stack ${stackName}: ${error.message}`);
        throw error;
      }
    }
  } else {
    logger.info(`Stack ${stackName} does not exist, creating...`);
    await cfClient.send(new CreateStackCommand(commandOptions));
    await waitUntilStackCreateComplete({ client: cfClient, maxWaitTime: 3600 }, { StackName: stackName });
    logger.success(`Stack ${stackName} created successfully.`);
  }
}
