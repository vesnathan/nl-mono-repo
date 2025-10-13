import type { ResourcesConfig } from "aws-amplify";
import { getDeploymentOutput } from "./deploymentOutputs";

const DEPLOYMENT_OUTPUT = getDeploymentOutput("ANA");
const AWS_REGION = "ap-southeast-2";
export const AMPLIFY_CONFIG: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: DEPLOYMENT_OUTPUT.awseUserPoolId,
      userPoolClientId: DEPLOYMENT_OUTPUT.awseUserPoolClientId,
      allowGuestAccess: true,
      identityPoolId: DEPLOYMENT_OUTPUT.awseIdentityPoolId,
    },
  },
  API: {
    GraphQL: {
      endpoint: DEPLOYMENT_OUTPUT.awseGraphQLUrl,
      region: AWS_REGION,
      defaultAuthMode: "userPool",
    },
  },
};
