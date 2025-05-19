import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-providers';

export async function getAwsAccountId(profile?: string): Promise<string> {
  try {
    const stsClient = new STSClient({ 
      region: 'ap-southeast-2',
      credentials: profile ? fromIni({ profile }) : undefined
    });
    
    const response = await stsClient.send(new GetCallerIdentityCommand({}));
    
    if (!response.Account) {
      throw new Error('Could not retrieve AWS Account ID');
    }
    
    return response.Account;
  } catch (error) {
    console.error('Error getting AWS Account ID:', error);
    throw error;
  }
}
