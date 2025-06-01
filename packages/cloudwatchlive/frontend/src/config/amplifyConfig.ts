import type { ResourcesConfig } from "aws-amplify";
import { getDeploymentOutput } from "./deploymentOutputs";

const DEPLOYMENT_OUTPUT = getDeploymentOutput("CWL");
const AWS_REGION = "ap-southeast-2";
export const AMPLIFY_CONFIG: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: DEPLOYMENT_OUTPUT.cwlUserPoolId,
      userPoolClientId: DEPLOYMENT_OUTPUT.cwlUserPoolClientId,
      allowGuestAccess: true,
      identityPoolId: DEPLOYMENT_OUTPUT.cwlIdentityPoolId,
    },
  },
  API: {
    GraphQL: {
      endpoint: DEPLOYMENT_OUTPUT.cwlGraphQLUrl,
      region: AWS_REGION,
      defaultAuthMode: "userPool",
    },
  },
};
