import { CloudFormation } from '@aws-sdk/client-cloudformation';
import fs from 'fs';
import path from 'path';

export async function generateCWLConfig() {
  const stage = process.env.STAGE || 'dev';
  const region = 'ap-southeast-2';
  const cfn = new CloudFormation({ region });

  try {
    // Get CloudFormation exports
    const { Exports = [] } = await cfn.listExports({});

    // Extract the required values from exports
    const userPoolId = Exports.find(e => e.Name === `cwlUserPoolId-${stage}`)?.Value;
    const userPoolClientId = Exports.find(e => e.Name === `cwlUserPoolClientId-${stage}`)?.Value;
    const userPoolArn = Exports.find(e => e.Name === `cwlUserPoolArn-${stage}`)?.Value;
    const graphqlUrl = Exports.find(e => e.Name === `CWLAppsyncUrl-${stage}`)?.Value;
    const identityPoolId = Exports.find(e => e.Name === `cwlIdentityPoolId-${stage}`)?.Value;

    // Verify required values exist
    if (!userPoolId || !userPoolClientId || !graphqlUrl) {
      throw new Error('Missing required CloudFormation exports');
    }

    // Create the output configuration
    const config = {
      [stage]: {
        cwlUserPoolId: userPoolId,
        cwlUserPoolClientId: userPoolClientId,
        cwlIdentityPoolId: identityPoolId || '', // Optional
        cwlGraphQLUrl: graphqlUrl,
      }
    };

    // Write to the backend config file
    const outputPath = path.resolve(__dirname, '../../cloudwatchlive/backend/config/cwlSlsOutput.json');
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));

    console.log('CWL configuration file updated successfully');

  } catch (error) {
    console.error('Error generating CWL configuration:', error);
    throw error;
  }
}

// Run the script
generateCWLConfig().catch(() => process.exit(1));
