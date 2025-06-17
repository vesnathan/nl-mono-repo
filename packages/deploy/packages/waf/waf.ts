import { 
  CloudFormation, 
  waitUntilStackUpdateComplete,
  waitUntilStackCreateComplete,
  Parameter,
  Capability
} from '@aws-sdk/client-cloudformation';
import { DeploymentOptions, getStackName, getTemplateBody } from '../../types';
import { logger } from '../../utils/logger';
import { IamManager } from '../../utils/iam-manager';

export async function deployWaf(options: DeploymentOptions): Promise<void> {
  const stackName = getStackName('waf', options.stage);
  logger.info('Starting WAF deployment...');

  // Initialize CloudFormation client in us-east-1 (required for WAF)
  const cfn = new CloudFormation({ region: 'us-east-1' });
  
  // Set up IAM role
  const iamManager = new IamManager('us-east-1');
  const roleArn = await iamManager.setupRole('waf', options.stage);
  if (!roleArn) {
    throw new Error('Failed to setup role for waf');
  }

  try {
    // Create or update the stack
    const templateBody = await getTemplateBody('waf');
    const params = {
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        {
          ParameterKey: 'Stage',
          ParameterValue: options.stage,
        }
      ] as Parameter[],
      Capabilities: ['CAPABILITY_NAMED_IAM'] as Capability[],
      RoleARN: roleArn
    };

    // Check if stack exists
    try {
      await cfn.describeStacks({ StackName: stackName });
      logger.info(`Updating existing stack: ${stackName}`);
      await cfn.updateStack(params);
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('does not exist')) {
        logger.info(`Creating new stack: ${stackName}`);
        await cfn.createStack(params);
      } else {
        throw error;
      }
    }

    // Wait for stack completion
    logger.info('Waiting for stack operation to complete...');
    await waitUntilStackUpdateComplete({ client: cfn, maxWaitTime: 600 }, { StackName: stackName })
      .catch(() => waitUntilStackCreateComplete({ client: cfn, maxWaitTime: 600 }, { StackName: stackName }));
    
    logger.success('WAF deployment completed successfully');

  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('No updates are to be performed')) {
      logger.info('No updates required for WAF stack');
      return;
    }
    logger.error(`WAF deployment failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
