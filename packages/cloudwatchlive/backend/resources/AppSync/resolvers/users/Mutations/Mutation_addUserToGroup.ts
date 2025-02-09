import { AdminAddUserToGroupCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { AppSyncResolverEvent } from "aws-lambda";
import { getProcessEnv } from "../../getProcessEnv";

export async function handler(event: AppSyncResolverEvent<any>) {
  const { cwlUserPoolId } = getProcessEnv();


  // Get username from previous function
  const input = JSON.parse(event.prev?.result.body);
  console.log("input - addUserToGroup", input);
  const cognitoUsername = input.cognitoUsername;
  console.log("cognitoUsername - addUserToGroup", cognitoUsername);
  const clientType = input.input.clientType;
  console.log("clientType - addUserToGroup", clientType);
  if (!cwlUserPoolId) {
    throw new Error("Missing required environment variables.");
  }

  if (!cognitoUsername) {
    throw new Error("Username not found in pipeline response. - addUserToGroup");
  }

  const client = new CognitoIdentityProviderClient({});
  const params = {
    UserPoolId: cwlUserPoolId,
    Username: cognitoUsername,
    GroupName: clientType,
  };

  try {
    const response = await client.send(new AdminAddUserToGroupCommand(params));
    console.log("response - addUserToGroup", response);
    return {
      statusCode: 200,
      body: JSON.stringify({ input: input.input }),
    };
  } catch (error) {
    console.error("Error adding user to group: - addUserToGroup", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error. - addUserToGroup" }),
    };
  }
}
// vesnathan+test@gmail.com