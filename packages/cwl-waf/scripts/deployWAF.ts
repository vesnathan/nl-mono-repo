import { execCommandAsPromise } from '../../shared/scripts/execCommandAsPromise';

const deployWAF = async () => {
  const stage = process.env.STAGE;
  const awsAccount = process.env.AWS_ACCOUNT_ID;

  if (!stage) {
    throw new Error('STAGE environment variable is required');
  }

  if (!awsAccount) {
    throw new Error('AWS_ACCOUNT_ID environment variable is required');
  }

  try {
    await execCommandAsPromise('yarn build');
    await execCommandAsPromise(`yarn cdk deploy CWLWafStack-${stage} --require-approval never -c stage=${stage}`);
    
    // Save the WAF ARN to an output file for other services to use
    const outputs = JSON.parse(await execCommandAsPromise(`aws cloudformation describe-stacks --stack-name CWLWafStack-${stage} --query 'Stacks[0].Outputs' --output json`));
    const wafArn = outputs.find((output: any) => output.OutputKey === 'CloudFrontWAFArn').OutputValue;
    
    await execCommandAsPromise(`echo '{ "WafArn": "${wafArn}" }' > WAF_output.json`);
  } catch (error) {
    console.error('Error deploying WAF:', error);
    process.exit(1);
  }
};

deployWAF();
