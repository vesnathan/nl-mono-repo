import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import {
  Mutation,
  MutationToAdminSetUserMFAPreferenceArgs,
} from "../../gqlTypes";
import { getProcessEnv } from "../../getProcessEnv";

type OUTPUT = Mutation["adminSetUserMFAPreference"];
const cognito = new CognitoIdentityProvider();

export const handler = async (event: any): Promise<OUTPUT> => {
  const { input } = event.arguments as MutationToAdminSetUserMFAPreferenceArgs;
  const lambdaEnv = getProcessEnv();

  const UserPoolId = lambdaEnv.ftaUserPoolId;
  const Username = input.userEmail;

  await cognito.adminSetUserMFAPreference({
    SoftwareTokenMfaSettings: { 
      "Enabled": true,
      "PreferredMfa": true,
   },
    Username,
    UserPoolId,
  });
  
  return {
    userId: input.userId,
  };
};
