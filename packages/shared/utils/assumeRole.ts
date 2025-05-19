import { STSClient, AssumeRoleCommand, Credentials } from '@aws-sdk/client-sts';

export async function assumeRole(params: {
  roleArn: string;
  roleSessionName: string;
  region?: string;
}): Promise<Credentials> {
  const { roleArn, roleSessionName, region = 'ap-southeast-2' } = params;
  
  const stsClient = new STSClient({ region });
  
  try {
    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: roleSessionName,
      DurationSeconds: 3600, // 1 hour
    });

    const response = await stsClient.send(command);
    
    if (!response.Credentials) {
      throw new Error('No credentials returned from AssumeRole');
    }

    return response.Credentials;
  } catch (error) {
    console.error('Error assuming role:', error);
    throw error;
  }
}

export function getCredentialsConfig(credentials: Credentials) {
  if (!credentials.AccessKeyId || !credentials.SecretAccessKey || !credentials.SessionToken) {
    throw new Error('Invalid credentials');
  }

  return {
    credentials: {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
    }
  };
}
