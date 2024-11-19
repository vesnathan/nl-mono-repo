
import path from "path";
import { deploySlsBackend } from "sharedScripts/deploySlsBackend"

const start = async () => {
  await deploySlsBackend({
    hasFrontendDeployment: false,
    outputs: [
      {
        OUTPUT_PATH: path.resolve(
          "./WAF_output.json",
        ),
        OUTPUT_KEYS: ["CloudFrontWAFArn"],
      },
    ],
  });
};

start();
