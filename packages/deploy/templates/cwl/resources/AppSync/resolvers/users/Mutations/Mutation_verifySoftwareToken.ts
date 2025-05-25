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

  try {
  const response = await cognito.verifySoftwareToken({
    AccessToken: input.AccessToken,
    FriendlyDeviceName: input.FriendlyDeviceName,
    UserCode: input.UserCode,
  });
  console.log("response", response);
  return { success: true, message: response.Status || "" };
}
catch (error) {
  console.error("Error verifying software token", error);
  if (error instanceof Error) {
    throw new Error(error.message);
  }
  throw new Error("Unknown error occurred during token verification.");
}
};
