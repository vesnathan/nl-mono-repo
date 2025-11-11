import { isValidEnv } from "./validEnvs";
import environment from "./masterConfig";

type CCTOutput = {
  cctUserPoolId: string;
  cctUserPoolClientId: string;
  cctGraphQLUrl: string;
};

type DeploymentOutputMap = {
  CCT: CCTOutput;
};

export function getDeploymentOutput<T extends keyof DeploymentOutputMap>(
  outputType: T,
): DeploymentOutputMap[T] {
  if (!isValidEnv(environment)) {
    console.warn(
      `Environment not set or invalid: ${environment}. Using empty deployment outputs.`,
    );
  }

  type DeploymentOutput = DeploymentOutputMap[T];

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (outputType) {
    case "CCT": {
      const deploymentOutput: CCTOutput = {
        cctUserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
        cctUserPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
        cctGraphQLUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || "",
      };

      if (
        !deploymentOutput.cctUserPoolId ||
        !deploymentOutput.cctUserPoolClientId ||
        !deploymentOutput.cctGraphQLUrl
      ) {
        console.error(
          "Missing required environment variables for CCT configuration.",
        );
      }

      return deploymentOutput as DeploymentOutput;
    }
    default: {
      throw Error(`Invalid deployment outputType: ${outputType}`);
    }
  }
}
