import {
  CognitoUserGroup,
  Mutation,
  MutationToRegisterClientUserUnauthArgs,
} from "../../gqlTypes";
import { getProcessEnv } from "../../getProcessEnv";
import { addUserToCognitoAndFTAUserCollection } from "shared-aws-assets-backend/shared-functions/addUserToCognitoAndFTAUserCollection";
import { AppSyncResolverEvent } from "aws-lambda";

type OUTPUT = Mutation["registerClientUserUnauth"];

export const handler = async (
  event: AppSyncResolverEvent<MutationToRegisterClientUserUnauthArgs>,
): Promise<OUTPUT> => {
  const lambdaEnv = getProcessEnv();
  const { userId } = await addUserToCognitoAndFTAUserCollection({
    cognitoGroups: [CognitoUserGroup.Client],
    UserPoolId: lambdaEnv.ftaUserPoolId,
    createFTAUserInput: event.arguments.input,
    CognitoMessageAction: undefined,
  });

  return {
    userId,
  };
};
