import { IAM } from '@aws-sdk/client-iam';
import { StackType, getStackName } from '../types';
import { logger } from './logger';

export class IamManager {
  private iam: IAM;
  private currentUserArn: string | undefined;

  constructor(region: string = process.env.AWS_REGION || 'ap-southeast-2') {
    this.iam = new IAM({ region });
  }

  private async getCurrentUserArn(): Promise<string> {
    if (this.currentUserArn) {
      return this.currentUserArn;
    }

    try {
      const response = await this.iam.getUser();
      if (!response.User?.Arn) {
        throw new Error('Failed to get current user ARN');
      }
      this.currentUserArn = response.User.Arn;
      return this.currentUserArn;
    } catch (error: any) {
      logger.error(`Failed to get current user: ${error?.message}`);
      throw error;
    }
  }

  async setupRole(stackType: StackType, stage: string): Promise<string> {
    const roleName = `${getStackName(stackType, stage)}-role`;
    const currentUserArn = await this.getCurrentUserArn();
    
    try {
      // Check if role exists
      const role = await this.iam.getRole({ RoleName: roleName });
      logger.info(`Role ${roleName} already exists`);
      if (!role.Role?.Arn) {
        throw new Error(`Role ${roleName} exists but has no ARN`);
      }
      return role.Role.Arn;
    } catch (error: any) {
      if (error.name !== 'NoSuchEntity') {
        throw error;
      }

      // Create role with assume role policy
      logger.info(`Creating role: ${roleName}`);
      const createRoleResponse = await this.iam.createRole({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'cloudformation.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            },
            {
              Effect: 'Allow',
              Principal: {
                AWS: currentUserArn
              },
              Action: 'sts:AssumeRole'
            }
          ]
        })
      });

      // Attach policy
      const policyDocument = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: '*',
            Resource: '*'
          }
        ]
      };

      await this.iam.putRolePolicy({
        RoleName: roleName,
        PolicyName: `${roleName}-policy`,
        PolicyDocument: JSON.stringify(policyDocument)
      });

      logger.success(`Created role ${roleName} with policy`);
      if (!createRoleResponse.Role?.Arn) {
        throw new Error(`Failed to create role ${roleName} - no ARN returned`);
      }
      return createRoleResponse.Role.Arn;
    }
  }
}
