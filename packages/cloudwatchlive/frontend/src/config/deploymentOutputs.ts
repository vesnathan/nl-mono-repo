import { isValidEnv } from "./validEnvs";
import environment from "./masterConfig";

// Use require for JSON import to avoid TypeScript issues
const deploymentOutputs = require("../../../../deploy/deployment-outputs.json");

type StackOutput = {
  OutputKey: string;
  OutputValue: string;
  Description?: string;
};

type StackInfo = {
  outputs: StackOutput[];
};

type DeploymentOutputs = {
  stacks: {
    shared?: StackInfo;
    cwl?: StackInfo;
  };
};

type CWLOutput = {
  cwlUserPoolId: string;
  cwlUserPoolClientId: string;
  cwlIdentityPoolId: string;
  cwlGraphQLUrl: string;
};

type DeploymentOutputMap = {
  CWL: CWLOutput;
};

function getOutputValue(outputKey: string, stackType: 'shared' | 'cwl'): string {
  const typedOutputs = deploymentOutputs as DeploymentOutputs;
  const stack = typedOutputs.stacks[stackType];
  if (!stack) {
    throw new Error(`Stack ${stackType} not found in deployment outputs`);
  }
  
  const output = stack.outputs.find((o: StackOutput) => o.OutputKey === outputKey);
  if (!output) {
    throw new Error(`Output ${outputKey} not found in ${stackType} stack`);
  }
  
  return output.OutputValue;
}

export function getDeploymentOutput<T extends keyof DeploymentOutputMap>(
  outputType: T,
): DeploymentOutputMap[T] {
  if (!isValidEnv(environment)) {
    throw Error(`Invalid environment: ${environment}`);
  }

  type DeploymentOutput = DeploymentOutputMap[T];
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (outputType) {
    case "CWL": {
      const deploymentOutput: CWLOutput = {
        cwlUserPoolId: getOutputValue('CWLUserPoolId', 'shared'),
        cwlUserPoolClientId: getOutputValue('CWLUserPoolClientId', 'shared'),
        cwlIdentityPoolId: getOutputValue('CWLIdentityPoolId', 'shared'),
        cwlGraphQLUrl: getOutputValue('ApiUrl', 'cwl')
      };
      return deploymentOutput as DeploymentOutput;
    }
    default: {
      throw Error(`Invalid deployment outputType: ${outputType}`);
    }
  }
}
