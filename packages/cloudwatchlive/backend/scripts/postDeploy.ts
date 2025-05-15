import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const region = 'ap-southeast-2';
const stage = process.env.STAGE || 'dev';

// Constants
const temporaryPassword = 'Temp1234!';
const defaultUser = {
  firstName: 'John', // Fixed value
  lastName: 'Doe' // Fixed value
};

// Function to prompt for email address
async function promptForEmail(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Please enter the user email address: ', (email) => {
      rl.close();
      resolve(email.trim());
    });
  });
}

async function setupUser() {
  try {
    console.log(`Starting post-deployment setup for stage ${stage}...`);
    
    // Get the Cognito User Pool ID from shared resources
    const userPoolId = await getCognitoUserPoolId();
    console.log(`Using Cognito User Pool ID: ${userPoolId}`);

    const email = await promptForEmail();
    const cognitoClient = new CognitoIdentityProviderClient({ region });
    const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

    // Create user in Cognito
    try {
      console.log(`Creating user in Cognito: ${email}...`);
      await cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: email,
          TemporaryPassword: temporaryPassword,
          UserAttributes: [
            {
              Name: 'email',
              Value: email,
            },
            {
              Name: 'given_name',
              Value: defaultUser.firstName,
            },
            {
              Name: 'family_name',
              Value: defaultUser.lastName,
            },
            {
              Name: 'email_verified',
              Value: 'true',
            },
          ],
        })
      );
    } catch (error: any) {
      if (error.name === 'UsernameExistsException') {
        console.log(`User ${email} already exists in Cognito. Getting user details...`);
      } else {
        throw error;
      }
    }

    // Set permanent password
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: temporaryPassword,
        Permanent: true,
      })
    );

    // Add user to Event Company Manager group
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: 'EventCompanyAdmin',
      })
    );

    // Create or update entry in DynamoDB
    console.log(`Adding user to DynamoDB table...`);
    // Reuse the existing dynamoClient and docClient
    
    // Get the table name from shared outputs
    console.log('Looking up DynamoDB table from outputs...');
    let tableName;
    try {
      const outputsPath = path.resolve(__dirname, '../../shared/config/cloudformation-outputs.json');
      
      if (!fs.existsSync(outputsPath)) {
        throw new Error(`CloudFormation outputs file not found at ${outputsPath}. Please ensure shared-aws-assets stack is deployed first.`);
      }
      
      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      tableName = outputs[stage]?.cwlUserTableArn;
      if (!tableName) {
        throw new Error(`Could not find user table ARN for stage ${stage} in outputs`);
      }
      console.log(`Using table ARN from outputs: ${tableName}`);
    } catch (error: any) {
      console.error('Error looking up table name:', error);
      throw error;
    }

    const userItem = {
      userId: email,
      organizationId: "org_" + Math.random().toString(36).substring(2, 15),
      privacyPolicy: true,
      termsAndConditions: true,
      userAddedById: email, // Self-created admin user
      userCreated: new Date().toISOString(),
      userEmail: email,
      userFirstName: defaultUser.firstName,
      userLastName: defaultUser.lastName,
      userPhone: "+1234567890",
      userRole: "Event Coordinator",
      userTitle: "Mr",
      clientType: ["SuperAdmin"],  // Default to SuperAdmin for test user
    };
    
    await dynamoClient.send(new PutCommand({
      TableName: tableName,
      Item: userItem
    }));

    console.log(`User can now log in with email: ${email} and password: ${temporaryPassword}`);
  } catch (error) {
    console.error('Error setting up user:', error);
    throw error;
  }
}

// Helper function to get Cognito User Pool ID from shared resources outputs
async function getCognitoUserPoolId(): Promise<string> {
  try {
    const outputsPath = path.resolve(__dirname, '../../shared/config/cloudformation-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`CloudFormation outputs file not found at ${outputsPath}. Please ensure shared-aws-assets stack is deployed first.`);
    }
    
    const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    const userPoolId = outputs[stage]?.cwlUserPoolId;
    if (!userPoolId) {
      throw new Error(`Could not find Cognito User Pool ID for stage ${stage} in outputs`);
    }
    
    return userPoolId;
    
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
