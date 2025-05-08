import { execCommandAsPromise } from '../../shared/scripts/execCommandAsPromise';

const initCDK = async () => {
  const stage = process.env.STAGE;
  if (!stage) {
    throw new Error('STAGE environment variable is required');
  }

  // Get AWS account from environment or configuration
  const awsAccount = process.env.AWS_ACCOUNT_ID;
  const awsRegion = 'us-east-1'; // CloudFront WAF must be in us-east-1

  if (!awsAccount) {
    throw new Error('AWS_ACCOUNT_ID environment variable is required');
  }

  try {
    // Install CDK CLI globally if not already installed
    await execCommandAsPromise('npm install -g aws-cdk');
    
    // Bootstrap CDK in the specific account/region
    await execCommandAsPromise(`cdk bootstrap aws://${awsAccount}/${awsRegion}`);
    
    console.log('CDK initialization completed successfully');
  } catch (error) {
    console.error('Error initializing CDK:', error);
    process.exit(1);
  }
};

initCDK();