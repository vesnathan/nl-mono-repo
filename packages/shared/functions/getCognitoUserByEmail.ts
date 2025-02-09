import {
  CognitoIdentityProvider,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProvider();
export const getCognitoUserByEmail = async (input: {
  userEmail: string;
  userPoolId: string;
}): Promise<UserType | null> => {
  const listUsersResult = await cognito.listUsers({
    AttributesToGet: ["email", "sub"],
    Filter: `"email"="${input.userEmail}"`,
    UserPoolId: input.userPoolId,
  });
  const users = listUsersResult.Users || [];
  if (users.length > 0) {
    return users[0];
  }
  return null;
};
