import type { ResourcesConfig } from "aws-amplify";
import { getSlsOutput } from "./config/slsConfig";

const SLS_OUTPUT = getSlsOutput("CWL");
const AWS_REGION = "ap-southeast-2";
export const AMPLIFY_CONFIG: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: SLS_OUTPUT.cwlUserPoolId,
      userPoolClientId: SLS_OUTPUT.cwlUserPoolClientId,
      allowGuestAccess: true,
      identityPoolId: SLS_OUTPUT.cwlIdentityPoolId,
    },
  },
  API: {
    GraphQL: {
      endpoint: SLS_OUTPUT.cwlGraphQLUrl,
      region: AWS_REGION,
      defaultAuthMode: "iam",
    },
  },
};
