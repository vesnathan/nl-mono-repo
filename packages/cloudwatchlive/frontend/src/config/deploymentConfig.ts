import type { ResourcesConfig } from "aws-amplify";
import { deploymentConfig } from "../utils/deployment-config";
import { getDeploymentOutput } from "./deploymentOutputs";
import { isValidEnv } from "./validEnvs";
import environment from "./masterConfig";

/**
 * Get Amplify configuration using deployment outputs
 * Falls back to the legacy deployment config if deployment outputs are not available
 */
export function getAmplifyConfig(): ResourcesConfig {
  // Check if we have valid environment and deployment outputs
  if (isValidEnv(environment) && deploymentConfig.isStackDeployed("cwl")) {
    try {
      const config = deploymentConfig.getCWLConfig();

      return {
        Auth: {
          Cognito: {
            userPoolId: config.userPoolId,
            userPoolClientId: config.userPoolClientId,
            allowGuestAccess: true,
            identityPoolId: config.identityPoolId,
          },
        },
        API: {
          GraphQL: {
            endpoint: config.graphQLUrl,
            region: config.region,
            defaultAuthMode: "iam",
          },
        },
      };
    } catch (error) {
      console.warn(
        "Failed to load deployment outputs, falling back to legacy deployment config:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Fallback to legacy deployment config
  const DEPLOYMENT_OUTPUT = getDeploymentOutput("CWL");
  const AWS_REGION = "ap-southeast-2";

  return {
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
        defaultAuthMode: "iam",
      },
    },
  };
}

// Export the configuration - this maintains backward compatibility
export const AMPLIFY_CONFIG: ResourcesConfig = getAmplifyConfig();
