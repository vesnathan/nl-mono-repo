import { AppSyncIdentityCognito, AppSyncResolverEvent } from "aws-lambda";
import { MutationToSaveSuperAdminClientArgs } from "../../gqlTypes";
import { getCognitoUserByEmail } from "shared/functions/getCognitoUserByEmail";
import { getProcessEnv } from "../../getProcessEnv";
import { AdminCreateUserCommand, AdminCreateUserCommandInput, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

export async function handler(
  event: AppSyncResolverEvent<MutationToSaveSuperAdminClientArgs>,
) {
  const { input } = event.arguments;

  console.log('input - createCognitoUser', input);
  const { cwlUserPoolId } = getProcessEnv();
  console.log('cwlUserPoolId - createCognitoUser', cwlUserPoolId);
  if (!cwlUserPoolId) {
    console.log('createCognitoUser - User Pool ID is missing from environment variables.');
    throw new Error("User Pool ID is missing from environment variables.");
  }
  const client = new CognitoIdentityProviderClient({});
  const existingCognitoUser = await getCognitoUserByEmail({
    userEmail: input.userEmail,
    userPoolId: cwlUserPoolId || "",
  });
  console.log('existingCognitoUser - createCognitoUser', existingCognitoUser);
  if (existingCognitoUser) {
    console.log('User already exists. - createCognitoUser');
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User already exists.',
        input,
        cognitoUsername: existingCognitoUser.Username,
      }),
    };
  }

  console.log('Creating user... - createCognitoUser');

  const params: AdminCreateUserCommandInput = {
    UserPoolId: cwlUserPoolId!,
    Username: input.userEmail,
    UserAttributes: [
      {
        Name: 'email',
        Value: input.userEmail,
      },
      {
        Name: 'email_verified',
        Value: 'true',
      },
    ],
  };

  console.log('params - createCognitoUser', params);

  try {
    const response = await client.send(new AdminCreateUserCommand(params));
    console.log('response - createCognitoUser', response);
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User created successfully.',
        input,
        cognitoUsername: response.User?.Username,
      }),
    };
  } catch (error) {

    console.error('Error creating user: - createCognitoUser', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' }),
    };
  }
}