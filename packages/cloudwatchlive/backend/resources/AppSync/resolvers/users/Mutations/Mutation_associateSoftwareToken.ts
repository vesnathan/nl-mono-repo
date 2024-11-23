import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import {
  Mutation,
  MutationToAssociateSoftwareTokenArgs,
} from "../../gqlTypes";
import { getProcessEnv } from "../../getProcessEnv";

type OUTPUT = Mutation["associateSoftwareToken"];
const cognito = new CognitoIdentityProvider();

export const handler = async (event: any): Promise<OUTPUT> => {
  const { accessToken } = event.arguments as MutationToAssociateSoftwareTokenArgs;
  const lambdaEnv = getProcessEnv();

  const response = await cognito.associateSoftwareToken({
    AccessToken: accessToken,
  });
  
  return { secretCode: response.SecretCode || "" };
};
