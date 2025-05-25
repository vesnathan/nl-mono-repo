import { CloudFormation, StackStatus } from '@aws-sdk/client-cloudformation';

const removeCWL = async () => {
  const stage = process.env.STAGE || 'dev';
  const region = 'ap-southeast-2';
  
  // Use the standardized stack name format
  const stackName = `nlmonorepo-cwl-${stage}`;
  
  const cfn = new CloudFormation({ region });

  try {
    console.log(`Attempting to delete CloudWatchLive stack: ${stackName}...`);
    
    // Check if stack exists before trying to delete
    try {
      await cfn.describeStacks({ StackName: stackName });
      console.log(`Stack ${stackName} found, proceeding with deletion...`);
      await cfn.deleteStack({ StackName: stackName });
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 400 && error.message?.includes('does not exist')) {
        console.log(`Stack ${stackName} does not exist, nothing to delete.`);
        return;
      }
      throw error;
    }

    // Poll for stack deletion status
    console.log(`Monitoring deletion status for ${stackName}...`);
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

        if (status === StackStatus.DELETE_FAILED) {
          console.error('Stack deletion failed. Attempting to retry with RetainResources...');
          
          // If delete failed, try again with RetainResources for nested stacks
          try {
            await cfn.deleteStack({
              StackName: stackName,
              RetainResources: ['DynamoDBStack', 'S3Stack', 'CloudFrontStack', 'AppSyncStack', 'LambdaStack']
            });
            console.log('Retry deletion initiated with RetainResources');
          } catch (retryError) {
            console.error('Error even with RetainResources, you may need to delete resources manually:', retryError);
            throw retryError;
          }
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
    console.error('Failed to delete CWL stack:', error);
    throw error;
  }
};

removeCWL().catch((error) => {
  console.error('Error in removeCWL script:', error);
});