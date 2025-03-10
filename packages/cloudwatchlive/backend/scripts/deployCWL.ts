import path from "path";
import { deploySlsBackend } from "shared/scripts/deploySlsBackend";

const start = async () => {
  await deploySlsBackend({
    hasFrontendDeployment: true,
    WAF: true,
    outputs: [
      // write sls output for AWS Amplify config
      {
        OUTPUT_PATH: path.resolve(
          "./config/cwlSlsOutput.json",
        ),
        // these keys should match with outputs from serverless.yml
        OUTPUT_KEYS: [
          "cwlUserPoolId",
          "cwlUserPoolClientId",
          "cwlIdentityPoolId",
          "cwlGraphQLUrl",
          "cwlUserTableArn",
          "cwlUserTableId",
          "apiURL",
        ],
        consoleLog: true,
      },
    ],
  });
};

start();
