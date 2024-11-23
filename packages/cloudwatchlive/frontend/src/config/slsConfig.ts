import { isValidEnv } from "./validEnvs";
import environment from "./masterConfig";
import CWLOutputJSON from "../../../backend/config/cwlSlsOutput.json";
type CWLOutput = {
  cwlUserPoolId: string;
  cwlUserPoolClientId: string;
  cwlIdentityPoolId: string;
  cwlGraphQLUrl: string;
};

type SlsOutputMap = {
  CWL: CWLOutput;
};

export function getSlsOutput<T extends keyof SlsOutputMap>(
  outputType: T,
): SlsOutputMap[T] {
  if (!isValidEnv(environment)) {
    throw Error(`Invalid environment: ${environment}`);
  }

  type SlsOutput = SlsOutputMap[T];
  switch (outputType) {
    case "CWL": {
      const slsOutput: CWLOutput = CWLOutputJSON[environment];
      return slsOutput as SlsOutput;
    }
    default: {
      throw Error(`Invalid sls outputType: ${outputType}`);
    }
  }
}
