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
  console.log("accessToken", accessToken);
  const lambdaEnv = getProcessEnv();
  console.log("cognito", cognito);
  try {
    const response = await cognito.associateSoftwareToken({
      AccessToken: accessToken,
    });
    console.log("response", response);
    return { secretCode: response.SecretCode || "" };
  } catch (error) {
    console.error("Error associating software token", error);
    throw new Error("Failed to associate software token");
  }
};
