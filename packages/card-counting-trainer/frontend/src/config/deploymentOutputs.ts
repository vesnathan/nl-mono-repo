import { isValidEnv } from "./validEnvs";
import environment from "./masterConfig";

type CCTOutput = {
  cctUserPoolId: string;
  cctUserPoolClientId: string;
  cctIdentityPoolId: string;
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

  switch (outputType) {
    case "CCT": {
      const deploymentOutput: CCTOutput = {
        cctUserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
        cctUserPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
        cctIdentityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || "",
        cctGraphQLUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || "",
      };

      if (
        !deploymentOutput.cctUserPoolId ||
        !deploymentOutput.cctUserPoolClientId ||
        !deploymentOutput.cctIdentityPoolId ||
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
