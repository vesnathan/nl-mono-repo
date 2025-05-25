import { CloudFormation, waitUntilStackDeleteComplete, StackStatus } from '@aws-sdk/client-cloudformation';

const removeWaf = async () => {
  const stage = process.env.STAGE || 'dev';
  const stackName = `nlmonorepo-waf-${stage}`;
  
  const cfn = new CloudFormation({
    region: 'us-east-1' // WAF for CloudFront must be in us-east-1
  });

  try {
    // Check if stack exists
    const stacks = await cfn.listStacks({});
    const stackExists = stacks.StackSummaries?.some(
      stack => stack.StackName === stackName && stack.StackStatus !== StackStatus.DELETE_COMPLETE
    );

    if (!stackExists) {
      console.log(`Stack ${stackName} does not exist or is already deleted`);
      return;
    }

    console.log(`Deleting stack ${stackName}...`);
    await cfn.deleteStack({ StackName: stackName });
    await waitUntilStackDeleteComplete(
      { client: cfn, maxWaitTime: 600 },
      { StackName: stackName }
    );

    console.log('WAF stack deletion completed successfully');
  } catch (error) {
    console.error('Error removing WAF:', error);
    throw error;
  }
};

removeWaf().catch(console.error);