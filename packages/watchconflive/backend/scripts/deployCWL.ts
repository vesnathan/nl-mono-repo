import path from "path";
import { deploySlsBackend } from "sharedScripts/deploySlsBackend";

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
          "apiURL",
        ],
        consoleLog: true,
      },
      // write sls output for e2e test
      {
        OUTPUT_PATH: path.resolve("../frontend/playwright/setupTest.json"),
        // these keys should match with outputs from serverless.yml
        OUTPUT_KEYS: [
          "cwlLatestDataTableName",
          "cwlSetupTestIAMAccessKey",
          "cwlSetupTestIAMAccessSecret",
          "cwlSetupTestIAMRoleArn",
          "cwlGraphQLUrl",
          "cwlCloudFrontDomainName",
          "cwlUserPoolId",
        ].filter((v) => !!v),
      },
    ],
  });
};

start();
