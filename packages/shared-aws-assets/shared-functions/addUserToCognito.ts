import { CognitoIdentityProvider, MessageActionType } from "@aws-sdk/client-cognito-identity-provider";
import { UserGroup, CWLUser } from "../../cloudwatchlive/backend/resources/AppSync/resolvers/gqlTypes";
import { generatePassword } from "./generatePassword";
import { SERVER_ERROR_CODE } from "shared/constants/serverErrorCode";

type CreateCWLUserInput = {
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userCreated: string;
};
const cognito = new CognitoIdentityProvider();
export const addUserToCognito = async (input: {
  createCWLUserInput: CreateCWLUserInput;
  cognitoGroups: UserGroup[];
  UserPoolId: string;
  CognitoMessageAction: MessageActionType | undefined
}): Promise<CWLUser> => {
  const { createCWLUserInput, CognitoMessageAction, UserPoolId } = input;
  // first, check if user email already exists
  const checkUserEmailExists = async () => {
    const listUsersResult = await cognito.listUsers({
      AttributesToGet: ["email", "sub"],
      Filter: `"email"="${createCWLUserInput.userEmail}"`,
      UserPoolId,
    });
    const users = listUsersResult.Users || [];
    if (users.length > 0) {
      throw Error(SERVER_ERROR_CODE.USER_ALREADY_EXISTS);
    }
  };
  await checkUserEmailExists();

  // add user to cognito
  const Username = createCWLUserInput.userEmail;
  const tempPassword = generatePassword(true, true, true, true, 8);
  console.log("Creating user in cognito");
  const adminCreateUserResult = await cognito.adminCreateUser({
    TemporaryPassword: tempPassword,
    Username,
    UserPoolId,
    MessageAction: CognitoMessageAction
  });
  console.log("Cognito user created", adminCreateUserResult);

  if (!adminCreateUserResult.User || !adminCreateUserResult.User.Username) {
    throw Error(`Unable to create user 127.343`);
  }
  return {
    userId: adminCreateUserResult.User.Username,
    userEmail: createCWLUserInput.userEmail,
    userFirstName: createCWLUserInput.userFirstName,
    userLastName: createCWLUserInput.userLastName,
    userCreated: createCWLUserInput.userCreated,
  };
};
