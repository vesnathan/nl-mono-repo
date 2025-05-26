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
      logger.info('Getting current IAM user...');
      const response = await this.iam.getUser();
      if (!response.User?.Arn) {
        throw new Error('Failed to get current user ARN');
      }
      this.currentUserArn = response.User.Arn;
      logger.info(`Current user ARN: ${this.currentUserArn}`);
      return this.currentUserArn;
    } catch (error: any) {
      logger.error(`Failed to get current user: ${error?.message}`);
      throw error;
    }
  }

  async setupRole(stackType: StackType, stage: string): Promise<string> {
    const roleName = `${getStackName(stackType, stage)}-role`;
    
    try {
      logger.info(`Getting current user ARN for role ${roleName}...`);
      const currentUserArn = await this.getCurrentUserArn();
      
      // Check if role exists
      logger.info(`Checking if role ${roleName} exists...`);
      try {
        const role = await this.iam.getRole({ RoleName: roleName });
        logger.info(`Role ${roleName} already exists`);
        if (!role.Role?.Arn) {
          throw new Error(`Role ${roleName} exists but has no ARN`);
        }
        return role.Role.Arn;
      } catch (roleError: any) {
        // Both NoSuchEntity and "role cannot be found" indicate the role doesn't exist
        if (!roleError.name?.includes('NoSuchEntity') && !roleError.message?.includes('cannot be found')) {
          logger.error(`Unexpected error checking role: ${roleError?.message}`);
          throw roleError;
        }
        logger.info(`Role ${roleName} does not exist, creating...`);
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
        }),
        Tags: [
          {
            Key: 'Purpose',
            Value: 'CloudFormation Stack Management'
          }
        ]
      });

      if (!createRoleResponse.Role?.Arn) {
        throw new Error(`Failed to create role ${roleName} - no ARN returned`);
      }

      // Attach policy
      logger.info(`Attaching policy to role ${roleName}...`);
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
      return createRoleResponse.Role.Arn;
    } catch (error: any) {
      logger.error(`Failed to setup role ${roleName}: ${error?.message}`);
      throw error;
    }
  }
}
