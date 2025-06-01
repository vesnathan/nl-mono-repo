import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand, 
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  CreateGroupCommand,
  ListGroupsCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand,
  DescribeTableCommand 
} from '@aws-sdk/client-dynamodb';
import { CloudFormationClient, DescribeStacksCommand, ListExportsCommand } from '@aws-sdk/client-cloudformation';
import { logger } from './logger';

export interface UserSetupOptions {
  stage: string;
  adminEmail?: string;
  region?: string;
}

export interface UserDetails {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  userTitle: string;
  userPhone: string;
}

export class UserSetupManager {
  private cognitoClient: CognitoIdentityProviderClient;
  private dynamoClient: DynamoDBClient;
  private cloudFormationClient: CloudFormationClient;
  private region: string;

  constructor(region = 'ap-southeast-2') {
    this.region = region;
    this.cognitoClient = new CognitoIdentityProviderClient({ region });
    this.dynamoClient = new DynamoDBClient({ region });
    this.cloudFormationClient = new CloudFormationClient({ region });
  }

  async createAdminUser(options: UserSetupOptions): Promise<void> {
    const { stage, adminEmail } = options;
    
    logger.info(`Setting up admin user for stage: ${stage}`);

    // Get user pool ID
    const userPoolId = await this.getCognitoUserPoolId(stage);
    logger.info(`Found Cognito User Pool ID: ${userPoolId}`);

    // Ensure required user groups exist
    await this.ensureCognitoGroups(userPoolId, stage);

    // Get user table name
    const tableName = `nlmonorepo-shared-usertable-${stage}`;
    await this.verifyTableExists(tableName);

    // Get admin email if not provided
    const userEmail = adminEmail || await this.promptForEmail();

    // Create or get existing user
    const cognitoUserId = await this.createOrGetCognitoUser(userPoolId, userEmail);

    // Create user in DynamoDb
    await this.createUserInDynamoDb(tableName, cognitoUserId, userEmail);

    // Validate user creation
    await this.validateUserCreation(userPoolId, tableName, cognitoUserId);

    logger.success('Admin user setup completed successfully!');
  }

  private async getCognitoUserPoolId(stage: string): Promise<string> {
    try {
      // Try to get from CloudFormation stack outputs first
      const stackName = `nlmonorepo-shared-${stage}`;
      const describeStacksResponse = await this.cloudFormationClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const stack = describeStacksResponse.Stacks?.[0];
      if (stack?.Outputs) {
        const userPoolOutput = stack.Outputs.find(output => output.OutputKey === 'CWLUserPoolId');
        if (userPoolOutput?.OutputValue) {
          return userPoolOutput.OutputValue;
        }
      }

      // Fallback to CloudFormation exports
      const listExportsResponse = await this.cloudFormationClient.send(new ListExportsCommand({}));
      const userPoolExport = listExportsResponse.Exports?.find(
        exp => exp.Name === `nlmonorepo-shared-${stage}-user-pool-id`
      );

      if (userPoolExport?.Value) {
        return userPoolExport.Value;
      }

      throw new Error(`Could not find Cognito User Pool ID for stage ${stage}`);
    } catch (error) {
      logger.error(`Error getting Cognito User Pool ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async ensureCognitoGroups(userPoolId: string, stage: string): Promise<void> {
    logger.info('Checking Cognito user groups...');
    
    const requiredGroups = ['SuperAdmin', 'Admin', 'User'];
    
    try {
      const listGroupsResponse = await this.cognitoClient.send(
        new ListGroupsCommand({ UserPoolId: userPoolId })
      );
      
      const existingGroups = listGroupsResponse.Groups?.map(group => group.GroupName) || [];
      
      for (const groupName of requiredGroups) {
        if (!existingGroups.includes(groupName)) {
          logger.info(`Creating group: ${groupName}`);
          await this.cognitoClient.send(new CreateGroupCommand({
            UserPoolId: userPoolId,
            GroupName: groupName,
            Description: `Auto-created ${groupName} group for nlmonorepo-${stage}`
          }));
          logger.success(`Created group: ${groupName}`);
        } else {
          logger.info(`Group '${groupName}' already exists`);
        }
      }
    } catch (error) {
      logger.error(`Error ensuring user groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async verifyTableExists(tableName: string): Promise<void> {
    try {
      await this.dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      logger.success(`Found DynamoDb table: ${tableName}`);
    } catch (error) {
      logger.error(`DynamoDb table ${tableName} does not exist`);
      throw new Error(`DynamoDb table ${tableName} does not exist. Cannot proceed with user creation.`);
    }
  }

  private async promptForEmail(): Promise<string> {
    // For now, return a default email - in a real implementation, you could use inquirer
    const defaultEmail = 'admin@example.com';
    logger.info(`Using default admin email: ${defaultEmail}`);
    logger.warning('To specify a custom email, use the ADMIN_EMAIL environment variable');
    return defaultEmail;
  }

  private async createOrGetCognitoUser(userPoolId: string, userEmail: string): Promise<string> {
    try {
      // Check if user already exists
      const getUserResponse = await this.cognitoClient.send(
        new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: userEmail
        })
      );
      
      logger.info('User already exists in Cognito. Getting user ID...');
      return getUserResponse.Username || userEmail;
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        // User doesn't exist, create them
        return await this.createNewCognitoUser(userPoolId, userEmail);
      }
      throw error;
    }
  }

  private async createNewCognitoUser(userPoolId: string, userEmail: string): Promise<string> {
    const tempPassword = 'Temp1234!';
    
    try {
      logger.info('Creating user in Cognito User Pool...');
      const createUserResponse = await this.cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: userEmail,
          TemporaryPassword: tempPassword,
          UserAttributes: [
            { Name: 'email', Value: userEmail },
            { Name: 'email_verified', Value: 'true' }
          ],
          MessageAction: 'SUPPRESS'
        })
      );

      const cognitoUserId = createUserResponse.User?.Username;
      if (!cognitoUserId) {
        throw new Error('Failed to create user in Cognito');
      }

      logger.success(`Created user in Cognito with ID: ${cognitoUserId}`);

      // Set permanent password
      logger.info('Setting permanent password...');
      await this.cognitoClient.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: userEmail,
          Password: tempPassword,
          Permanent: true
        })
      );

      logger.success('Set permanent password for user');

      // Add user to SuperAdmin group
      logger.info('Adding user to SuperAdmin group...');
      await this.cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: userEmail,
          GroupName: 'SuperAdmin'
        })
      );

      logger.success('Added user to SuperAdmin group');

      // Display user information
      logger.info('\n========== USER CREATED ==========');
      logger.info(`Username: ${userEmail}`);
      logger.info(`Password: ${tempPassword}`);
      logger.warning('Please change this password after first login for security reasons.');
      logger.info('===================================\n');

      return cognitoUserId;
    } catch (error) {
      logger.error(`Error creating Cognito user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async createUserInDynamoDb(tableName: string, cognitoUserId: string, userEmail: string): Promise<void> {
    try {
      // Check if user already exists in DynamoDb
      const getUserResponse = await this.dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: { userId: { S: cognitoUserId } }
        })
      );

      if (getUserResponse.Item) {
        logger.info('User already exists in DynamoDb table');
        return;
      }

      // Create user in DynamoDb with the same schema as deploy.sh
      const currentTimestamp = '1733530302'; // Fixed timestamp from deploy.sh
      
      const userItem = {
        userId: { S: cognitoUserId },
        organizationId: { S: '' },
        privacyPolicy: { BOOL: true },
        termsAndConditions: { BOOL: true },
        userAddedById: { S: '' },
        userCreated: { S: currentTimestamp },
        userEmail: { S: userEmail },
        userFirstName: { S: 'John' },
        userLastName: { S: 'Doe' },
        userPhone: { S: '0421 569 854' },
        userProfilePicture: {
          M: {
            Bucket: { S: '' },
            Key: { S: '' }
          }
        },
        userTitle: { S: 'Mr' },
        userRole: { S: 'System Administrator' }
      };

      logger.info(`Creating user entry in DynamoDb table ${tableName}...`);
      await this.dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: userItem
        })
      );

      logger.success(`Created user entry in DynamoDb table ${tableName}`);
    } catch (error) {
      logger.error(`Error creating user in DynamoDb: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateUserCreation(userPoolId: string, tableName: string, cognitoUserId: string): Promise<void> {
    try {
      // Validate user exists in DynamoDb
      const getUserResponse = await this.dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: { userId: { S: cognitoUserId } }
        })
      );

      if (!getUserResponse.Item) {
        throw new Error(`User validation failed: User not found in table ${tableName}`);
      }

      logger.success(`User validated successfully in table ${tableName}`);
    } catch (error) {
      logger.error(`User validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}
