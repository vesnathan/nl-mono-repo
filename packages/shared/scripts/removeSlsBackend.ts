import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const addWAFOutputToEnvVariables = async (options: {
  stage: string | undefined;
}) => {
  // should matched with serverless.yaml of cwl-waf
  const WAF_OUTPUT_NAMES = ["CloudFrontWAFArn"];
  const WAFOutputPath = path.resolve("/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cwl-waf/WAF_output.json");
  if (!fs.existsSync(WAFOutputPath)) {
    throw new Error(
      "WAF output file not found. Make sure to deploy WAF from cwl-waf package first.",
    );
  }
  if (!options.stage) {
    throw new Error(`Missing stage.`);
  }

  const WAFOutputJSON = JSON.parse(fs.readFileSync(WAFOutputPath, "utf8"));
  const WAFOutputJSONForStage = WAFOutputJSON[options.stage];
  if (!WAFOutputJSONForStage) {
    throw new Error(`Unable to file WAF output for stage ${options.stage}`);
  }
  WAF_OUTPUT_NAMES.forEach((WAF_OUTPUT_NAME) => {
    if (!WAFOutputJSONForStage[WAF_OUTPUT_NAME]) {
      throw new Error(
        `Cannot find field ${WAF_OUTPUT_NAME} in WAF output: ${WAFOutputPath}`,
      );
    }
    process.env[WAF_OUTPUT_NAME] = WAFOutputJSONForStage[WAF_OUTPUT_NAME];
  });
};

const parseRemoveArgs = async () => {
  return yargs(hideBin(process.argv))
    .option("stage", {
      alias: "s",
      type: "string",
      description: "serverless stage",
      requiresArg: true,
      demandOption: true,
    })
    .parse();
};

export const removeSlsBackend = async () => {
  const argv = await parseRemoveArgs();
  const STAGE = argv.stage;

  addWAFOutputToEnvVariables({
    stage: argv.stage,
  });
  
  return new Promise<void>((resolve, reject) => {
    exec(`serverless remove --stage ${STAGE}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error removing stack: ${stderr}`);
        reject(error);
      } else {
        console.log(`Stack removed: ${stdout}`);
        resolve();
      }
    });
  });
};