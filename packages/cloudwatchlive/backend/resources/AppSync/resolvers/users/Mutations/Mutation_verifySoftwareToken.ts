import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import {
  Mutation,
  MutationToVerifySoftwareTokenArgs,
} from "../../gqlTypes";
import { getProcessEnv } from "../../getProcessEnv";

type OUTPUT = Mutation["verifySoftwareToken"];
const cognito = new CognitoIdentityProvider();

export const handler = async (event: any): Promise<OUTPUT> => {
  const { input } = event.arguments as MutationToVerifySoftwareTokenArgs;
  const lambdaEnv = getProcessEnv();

  const response = await cognito.verifySoftwareToken({
    AccessToken: input.AccessToken,
    FriendlyDeviceName: input.FriendlyDeviceName,
    UserCode: input.UserCode,
  });
  
  return { status: response.Status || "" };
};
