import { isValidEnv } from "./validEnvs";
import environment from "./masterConfig";

// Removed the JSON import as it's no longer needed

type TSHOutput = {
  awseUserPoolId: string;
  awseUserPoolClientId: string;
  awseIdentityPoolId: string;
  awseGraphQLUrl: string;
};

type DeploymentOutputMap = {
  TSH: TSHOutput;
};

// Removed the getOutputValue function as it's no longer needed

export function getDeploymentOutput<T extends keyof DeploymentOutputMap>(
  outputType: T,
): DeploymentOutputMap[T] {
  if (!isValidEnv(environment)) {
    console.warn(
      `Environment not set or invalid: ${environment}. Using empty deployment outputs.`,
    );
    // Don't throw during build - allow it to continue with empty values
  }

  type DeploymentOutput = DeploymentOutputMap[T];
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (outputType) {
    case "TSH": {
      // Use neutral NEXT_PUBLIC_* env vars (populated by next.config)
      const deploymentOutput: TSHOutput = {
        awseUserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
        awseUserPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
        awseIdentityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || "",
        awseGraphQLUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || "",
      };

      if (
        !deploymentOutput.awseUserPoolId ||
        !deploymentOutput.awseUserPoolClientId ||
        !deploymentOutput.awseIdentityPoolId ||
        !deploymentOutput.awseGraphQLUrl
      ) {
        // eslint-disable-next-line no-console
        console.error(
          "Missing required environment variables for TSH configuration.",
        );
        // Depending on the desired behavior, you might want to throw an error
        // throw new Error('Missing required environment variables for TSH configuration.');
      }

      return deploymentOutput as DeploymentOutput;
    }
    default: {
      throw Error(`Invalid deployment outputType: ${outputType}`);
    }
  }
}
