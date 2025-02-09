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

  const UserPoolId = lambdaEnv.cwlUserPoolId;
  const Username = input.userEmail;

  try {
  const response = await cognito.adminSetUserMFAPreference({
    SoftwareTokenMfaSettings: { 
      "Enabled": true,
      "PreferredMfa": true,
   },
    Username,
    UserPoolId,
  });
  
  return {
    statusCode: "200",
    body: JSON.stringify({message: "MFA Preference Set"})
  };
} catch (e) {
  return {
    statusCode: "500",
    body: JSON.stringify({message: e})
  };
}
};
