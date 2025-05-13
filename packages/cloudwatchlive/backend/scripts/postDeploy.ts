import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';

const region = 'ap-southeast-2';
const stage = process.env.STAGE || 'dev';

// Constants
const temporaryPassword = 'Temp1234!'; // This will be changed on first login

interface UserDetails {
  email: string;
  firstName: string;
  lastName: string;
}

async function getUserDetails(): Promise<UserDetails> {
  const questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Enter the user\'s email address:',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          return 'Please enter a valid email address';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'firstName',
      message: 'Enter the user\'s first name:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'First name cannot be empty';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'lastName',
      message: 'Enter the user\'s last name:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Last name cannot be empty';
        }
        return true;
      }
    }
  ];

  return inquirer.prompt(questions);
}

async function setupUser() {
  try {
    console.log(`Starting post-deployment setup for stage ${stage}...`);
    
    // Get user details interactively
    const userDetails = await getUserDetails();
    const { email, firstName, lastName } = userDetails;
    
    // Get the Cognito User Pool ID from shared resources
    const userPoolId = await getCognitoUserPoolId();
    console.log(`Using Cognito User Pool ID: ${userPoolId}`);

    // Create user in Cognito (or get existing user)
    const cognitoClient = new CognitoIdentityProviderClient({ region });
    let userId: string;
    
    try {
      console.log(`Creating user in Cognito: ${email}...`);
      const createUserResponse = await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        TemporaryPassword: temporaryPassword,
        MessageAction: 'SUPPRESS', // Don't send an email - we'll set the password directly
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'email_verified',
            Value: 'true',
          },
          {
            Name: 'given_name',
            Value: firstName,
          },
          {
            Name: 'family_name',
            Value: lastName,
          }
        ],
      }));

      userId = createUserResponse.User?.Username || '';
      if (!userId) {
        throw new Error('Failed to get user ID from Cognito response');
      }
      
      console.log(`User created in Cognito with ID: ${userId}`);
    } catch (error: any) {
      if (error?.__type === 'UsernameExistsException') {
        console.log(`User ${email} already exists in Cognito. Getting user details...`);
        
        // Import the necessary command
        const { ListUsersCommand } = await import('@aws-sdk/client-cognito-identity-provider');
        
        // Look up the user to get their ID
        const listUsersResponse = await cognitoClient.send(new ListUsersCommand({
          UserPoolId: userPoolId,
          Filter: `email = "${email}"`,
          Limit: 1
        }));
        
        if (!listUsersResponse.Users || listUsersResponse.Users.length === 0) {
          throw new Error(`User ${email} exists but could not be found`);
        }
        
        userId = listUsersResponse.Users[0].Username || '';
        console.log(`Found existing user with ID: ${userId}`);
      } else {
        throw error;
      }
    }

    // Set the user's password
    console.log('Setting permanent password...');
    try {
      await cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: temporaryPassword,
        Permanent: true,
      }));
      console.log('Password set successfully');
    } catch (error: any) {
      console.warn(`Warning: Could not set password. This may be because the user already has a password set or is in a state that doesn't allow password changes.`, error.message);
    }
    
    // Create or update entry in DynamoDB
    console.log(`Adding user to DynamoDB table...`);
    const dynamoClient = new DynamoDBClient({ region });
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    // Get the correct table name from CloudFormation exports
    let tableName;
    try {
      const { CloudFormation } = await import('@aws-sdk/client-cloudformation');
      const cfn = new CloudFormation({ region });
      
      const { Exports } = await cfn.listExports({});
      // Check for this specific export name from the stack
      const tableExport = Exports?.find(exp => exp.Name && exp.Name === `CWLUsersTable-${stage}`);
      
      if (tableExport && tableExport.Value) {
        tableName = tableExport.Value;
      } else {
        // Use standard naming convention for the stack
        const alternativeExports = [
          `cloudwatchlive-backend-${stage}-UsersTable`,
          `cwlUsersTable-${stage}`,
          `UsersTable-${stage}`
        ];
        
        for (const exportName of alternativeExports) {
          const altExport = Exports?.find(exp => exp.Name && exp.Name === exportName);
          if (altExport && altExport.Value) {
            tableName = altExport.Value;
            break;
          }
        }
        
        // As a fallback, try looking for any export that might be the users table
        if (!tableName) {
          const userTableExport = Exports?.find(exp => 
            exp.Name && exp.Name.toLowerCase().includes('user') && 
            exp.Name.toLowerCase().includes('table')
          );
          
          if (userTableExport && userTableExport.Value) {
            tableName = userTableExport.Value;
          }
        }
      }
      
      if (!tableName) {
        // Last resort - use a hardcoded name format based on standard stack naming
        tableName = `cloudwatchlive-backend-${stage}-UsersTable`;
        console.log(`Could not find table export, using default name: ${tableName}`);
      } else {
        console.log(`Found table name from exports: ${tableName}`);
      }
    } catch (error: any) {
      // Default if we can't look up the name
      tableName = `CWLUsersTable-${stage}`;
      console.warn(`Error looking up table name: ${error.message}. Using default: ${tableName}`);
    }
    
    // Import the necessary command
    const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
    
    // Check if the user already exists in DynamoDB
    let existingUser;
    try {
      const getResponse = await docClient.send(new GetCommand({
        TableName: tableName,
        Key: {
          userId: userId
        }
      }));
      existingUser = getResponse.Item;
    } catch (error: any) {
      console.log(`Could not check for existing user: ${error.message}`);
    }
    
    const userItem = {
      userId: userId,
      organizationId: existingUser?.organizationId || "",
      PrivacyPolicy: existingUser?.PrivacyPolicy || "",
      TermsAndConditions: existingUser?.TermsAndConditions || "",
      userAddedById: existingUser?.userAddedById || "",
      userCreated: existingUser?.userCreated || new Date().toISOString(),
      userEmail: email,
      userFirstName: firstName,
      userLastName: lastName,
      userPhone: existingUser?.userPhone || "",
      userProfilePicture: existingUser?.userProfilePicture || {
        Bucket: "",
        Key: ""
      },
      userTitle: existingUser?.userTitle || ""
    };
    
    try {
      // Try to describe the table first to verify it exists
      const { DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      
      console.log(`Table ${tableName} exists, proceeding with user creation/update`);
      
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: userItem
      }));
      
      if (existingUser) {
        console.log(`User data updated in DynamoDB table ${tableName}`);
      } else {
        console.log(`User successfully added to DynamoDB table ${tableName}`);
      }
    } catch (error: any) {
      if (error.__type?.includes('ResourceNotFoundException')) {
        console.error(`DynamoDB table ${tableName} does not exist. Available tables may not have been exported properly from CloudFormation.`);
        console.log('Listing all CloudFormation exports to help debug:');
        
        const { CloudFormation } = await import('@aws-sdk/client-cloudformation');
        const cfn = new CloudFormation({ region });
        const { Exports } = await cfn.listExports({});
        
        console.log('Available exports:');
        Exports?.forEach(exp => {
          if (exp.Name && exp.Value) {
            console.log(`  - ${exp.Name}: ${exp.Value}`);
          }
        });
        
        throw new Error(`DynamoDB table ${tableName} not found. Deployment might not be complete or the table name may be different.`);
      } else {
        throw error;
      }
    }
    console.log('Post-deployment setup completed successfully!');
    console.log(`User can now log in with email: ${email} and password: ${temporaryPassword}`);
    
  } catch (error) {
    console.error('Error during post-deployment setup:', error);
    throw error;
  }
}

// Helper function to get Cognito User Pool ID from shared resources outputs
async function getCognitoUserPoolId(): Promise<string> {
  try {
    // Try to read from shared outputs first
    const sharedOutputPath = path.resolve(__dirname, '../../shared-aws-assets/outputs.json');
    if (fs.existsSync(sharedOutputPath)) {
      const sharedOutputs = JSON.parse(fs.readFileSync(sharedOutputPath, 'utf8'));
      if (sharedOutputs.UserPoolId) {
        return sharedOutputs.UserPoolId;
      }
    }
    
    // If not found, try to get from CloudFormation exports
    const { CloudFormation } = await import('@aws-sdk/client-cloudformation');
    const cfn = new CloudFormation({ region });
    
    const { Exports } = await cfn.listExports({});
    const userPoolExport = Exports?.find(exp => exp.Name === `cwlUserPoolId-${stage}`);
    
    if (!userPoolExport || !userPoolExport.Value) {
      throw new Error(`Could not find Cognito User Pool ID export for stage ${stage}`);
    }
    
    return userPoolExport.Value;
    
  } catch (error) {
    console.error('Error getting Cognito User Pool ID:', error);
    throw error;
  }
}

// Run the setup
setupUser().catch(error => {
  console.error('Post-deployment setup failed:', error);
  process.exit(1);
});
