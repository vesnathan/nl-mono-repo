import type { ResourcesConfig } from "aws-amplify";
import { getDeploymentOutput } from "./deploymentOutputs";

const DEPLOYMENT_OUTPUT = getDeploymentOutput("AWSE");
const AWS_REGION = "ap-southeast-2";
export const AMPLIFY_CONFIG: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: DEPLOYMENT_OUTPUT.awsbUserPoolId,
      userPoolClientId: DEPLOYMENT_OUTPUT.awsbUserPoolClientId,
      allowGuestAccess: true,
      identityPoolId: DEPLOYMENT_OUTPUT.awsbIdentityPoolId,
    },
  },
  API: {
    GraphQL: {
      endpoint: DEPLOYMENT_OUTPUT.awsbGraphQLUrl,
      region: AWS_REGION,
      defaultAuthMode: "userPool",
    },
  },
};
