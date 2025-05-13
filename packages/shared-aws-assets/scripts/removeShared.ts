import { CloudFormation } from '@aws-sdk/client-cloudformation';

const removeShared = async () => {
  const stage = process.env.STAGE || 'dev';
  const region = 'ap-southeast-2';
  const stackName = `shared-aws-assets-${stage}`;
  const cfn = new CloudFormation({ region });

  try {
    console.log(`Deleting stack: ${stackName}`);
    await cfn.deleteStack({ StackName: stackName });

    // Poll for stack deletion status
    while (true) {
      try {
        const { Stacks } = await cfn.describeStacks({ StackName: stackName });
        const stack = Stacks?.[0];

        if (!stack) {
          console.log('Stack deletion completed');
          break;
        }

        const status = stack.StackStatus;
        console.log(`Waiting for stack deletion... Current status: ${status}`);

        if (status === 'DELETE_FAILED') {
          throw new Error('Stack deletion failed');
        }

        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 400 && error.message?.includes('does not exist')) {
          console.log('Stack deletion completed');
          break;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to delete shared stack:', error);
    throw error;
  }
};

removeShared().catch((error) => {
  console.error('Error in removeShared script:', error);
});