import { CloudFormation, Capability, StackStatus } from '@aws-sdk/client-cloudformation';
import path from 'path';
import fs from 'fs';

const pollStackStatus = async (cfn: CloudFormation, stackName: string): Promise<void> => {
  while (true) {
    const { Stacks } = await cfn.describeStacks({ StackName: stackName }).catch(() => ({ Stacks: [] }));
    const stack = Stacks?.[0];

    if (!stack) {
      console.log('Stack not found');
      return;
    }

    const status = stack.StackStatus;
    console.log(`Current stack status: ${status}`);

    if (status === StackStatus.DELETE_IN_PROGRESS) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      continue;
    }

    if (status === StackStatus.ROLLBACK_IN_PROGRESS || status === StackStatus.ROLLBACK_COMPLETE) {
      throw new Error(`Stack ${stackName} is in rollback state: ${status}`);
    }

    if (status?.endsWith('COMPLETE')) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 10000));
  }
};

const deployWaf = async () => {
  const stage = process.env.STAGE || 'dev';
  const stackName = `CWLWafStack-${stage}`;
  const region = 'us-east-1'; // WAF for CloudFront must be in us-east-1
  const cfn = new CloudFormation({ region });
  const templatePath = path.resolve(__dirname, '../cfn-template.yaml');
  const templateBody = fs.readFileSync(templatePath, 'utf-8');

  try {
    const { Stacks } = await cfn.describeStacks({ StackName: stackName }).catch(() => ({ Stacks: [] }));
    const existingStack = Stacks?.[0];
    const isRollbackComplete = existingStack?.StackStatus === StackStatus.ROLLBACK_COMPLETE;
    const isRollbackInProgress = existingStack?.StackStatus === StackStatus.ROLLBACK_IN_PROGRESS;
    const isDeleteInProgress = existingStack?.StackStatus === StackStatus.DELETE_IN_PROGRESS;

    if (isRollbackComplete || isRollbackInProgress || isDeleteInProgress) {
      console.log(`Stack ${stackName} is in ${existingStack.StackStatus} state, deleting it first...`);
      await cfn.deleteStack({ StackName: stackName });
      await pollStackStatus(cfn, stackName);
      console.log('Stack deleted successfully');
    }

    const params = {
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        {
          ParameterKey: 'Stage',
          ParameterValue: stage
        }
      ],
      Capabilities: [Capability.CAPABILITY_NAMED_IAM]
    };

    if (existingStack) {
      console.log(`Updating stack ${stackName}...`);
      await cfn.updateStack(params);
    } else {
      console.log(`Creating stack ${stackName}...`);
      await cfn.createStack(params);
    }

    await pollStackStatus(cfn, stackName);
    console.log('WAF deployment completed successfully');
  } catch (error: any) {
    if (error.message?.includes('No updates are to be performed')) {
      console.log('No updates required for the WAF stack');
      return;
    }
    console.error('Error deploying WAF:', error);
    throw error;
  }
};

deployWaf().catch(console.error);