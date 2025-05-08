import { execCommandAsPromise } from '../../shared/scripts/execCommandAsPromise';

const removeWAF = async () => {
  const stage = process.env.STAGE;
  if (!stage) {
    throw new Error('STAGE environment variable is required');
  }

  try {
    await execCommandAsPromise(`yarn cdk destroy CWLWafStack-${stage} --force -c stage=${stage}`);
  } catch (error) {
    console.error('Error removing WAF:', error);
    process.exit(1);
  }
};

removeWAF();