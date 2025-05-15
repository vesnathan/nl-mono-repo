import type { CloudFormationOutputs } from "shared/config/types";
import type { ResourcesConfig } from "aws-amplify";
import config from "shared/config/cloudformation-outputs.json";
import environment from "./masterConfig";

const AWS_REGION = "ap-southeast-2";
const stage = environment || "dev";

const typedConfig = config as CloudFormationOutputs;

if (!typedConfig[stage]) {
  throw new Error(
    `No configuration found for stage ${stage} in cloudformation-outputs.json`,
  );
}

export const AMPLIFY_CONFIG: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: typedConfig[stage].cwlUserPoolId,
      userPoolClientId: typedConfig[stage].cwlUserPoolClientId,
      allowGuestAccess: true,
      identityPoolId: typedConfig[stage].cwlIdentityPoolId,
    },
  },
  API: {
    GraphQL: {
      endpoint: typedConfig[stage].cwlGraphQLUrl,
      region: AWS_REGION,
      defaultAuthMode: "userPool",
    },
  },
};
