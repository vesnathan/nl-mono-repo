import { isValidEnv } from "./validEnvs";
import environment from "./masterConfig";

// Removed the JSON import as it's no longer needed

type CWLOutput = {
  cwlUserPoolId: string;
  cwlUserPoolClientId: string;
  cwlIdentityPoolId: string;
  cwlGraphQLUrl: string;
};

type DeploymentOutputMap = {
  CWL: CWLOutput;
};

// Removed the getOutputValue function as it's no longer needed

export function getDeploymentOutput<T extends keyof DeploymentOutputMap>(
  outputType: T,
): DeploymentOutputMap[T] {
  if (!isValidEnv(environment)) {
    console.error(`Invalid environment: ${environment}`);
    throw Error(`Invalid environment: ${environment}`);
  }

  type DeploymentOutput = DeploymentOutputMap[T];
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (outputType) {
    case "CWL": {
      const deploymentOutput: CWLOutput = {
        cwlUserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
        cwlUserPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
        cwlIdentityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || "",
        cwlGraphQLUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || "",
      };

      if (
        !deploymentOutput.cwlUserPoolId ||
        !deploymentOutput.cwlUserPoolClientId ||
        !deploymentOutput.cwlIdentityPoolId ||
        !deploymentOutput.cwlGraphQLUrl
      ) {
        // eslint-disable-next-line no-console
        console.error(
          "Missing required environment variables for CWL configuration.",
        );
        // Depending on the desired behavior, you might want to throw an error
        // throw new Error('Missing required environment variables for CWL configuration.');
      }

      return deploymentOutput as DeploymentOutput;
    }
    default: {
      throw Error(`Invalid deployment outputType: ${outputType}`);
    }
  }
}
