import { 
  IAMClient, 
  CreateRoleCommand, 
  GetRoleCommand, 
  CreatePolicyCommand, 
  AttachRolePolicyCommand, 
  DeleteRoleCommand, 
  DetachRolePolicyCommand, 
  DeletePolicyCommand,
  ListAttachedRolePoliciesCommand 
} from '@aws-sdk/client-iam';
import { fromIni } from '@aws-sdk/credential-providers';
import fs from 'fs';
import path from 'path';
import { getAwsAccountId } from './getAwsAccountId';

export async function createOrGetDeploymentRole(stage: string, profile?: string): Promise<string> {
  const credentials = profile ? fromIni({ profile }) : undefined;
  const iam = new IAMClient({ 
    region: 'ap-southeast-2',
    credentials
  });
  const roleName = `cwl-deployment-role-${stage}`;
  const policyName = `cwl-deployment-policy-${stage}`;

  try {
    // Try to get existing role
    try {
      const getRoleResponse = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      if (!getRoleResponse.Role?.Arn) {
        throw new Error('Role ARN not found in response');
      }
      console.log('Found existing deployment role');
      return getRoleResponse.Role.Arn;
    } catch (error: any) {
      if (error?.name !== 'NoSuchEntityException') {
        throw error;
      }
    }

    // Create trust relationship
    // Get AWS Account ID
    const accountId = await getAwsAccountId();
    if (!accountId) {
      throw new Error('Failed to get AWS account ID');
    }
    
    const trustPolicy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: {
          AWS: `arn:aws:iam::${accountId}:root`
        },
        Action: 'sts:AssumeRole'
      }]
    };

    // Create role
    const createRoleResponse = await iam.send(new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: `Deployment role for CloudWatch Live ${stage} environment`
    }));

    if (!createRoleResponse.Role?.Arn) {
      throw new Error('Role ARN not found in create role response');
    }

    // Read and create policy
    const policyDocument = fs.readFileSync(
      path.resolve(__dirname, '../../cloudwatchlive/backend/config/deployment-role-policy.json'),
      'utf-8'
    );

    const createPolicyResponse = await iam.send(new CreatePolicyCommand({
      PolicyName: policyName,
      PolicyDocument: policyDocument
    }));

    if (!createPolicyResponse.Policy?.Arn) {
      throw new Error('Policy ARN not found in create policy response');
    }

    // Attach policy to role
    await iam.send(new AttachRolePolicyCommand({
      RoleName: roleName,
      PolicyArn: createPolicyResponse.Policy.Arn
    }));

    console.log('Created new deployment role');
    return createRoleResponse.Role.Arn;
  } catch (error) {
    console.error('Error creating deployment role:', error);
    throw error;
  }
}

export async function cleanupDeploymentRole(stage: string): Promise<void> {
  const iam = new IAMClient({ region: 'ap-southeast-2' });
  const roleName = `cwl-deployment-role-${stage}`;
  const policyName = `cwl-deployment-policy-${stage}`;

  try {
    // Get policy ARN
    const policies = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
    
    if (policies.AttachedPolicies) {
      const policyArn = policies.AttachedPolicies.find(p => p.PolicyName === policyName)?.PolicyArn;

      if (policyArn) {
        // Detach and delete policy
        await iam.send(new DetachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: policyArn
        }));

        await iam.send(new DeletePolicyCommand({
          PolicyArn: policyArn
        }));
      }
    }

    // Delete role
    await iam.send(new DeleteRoleCommand({
      RoleName: roleName
    }));

    console.log('Cleaned up deployment role and policy');
  } catch (error) {
    console.error('Error cleaning up deployment role:', error);
    throw error;
  }
}
