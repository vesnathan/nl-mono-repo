/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-object-injection */
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";
import { ValidEnv, validEnvironments } from "../../cloudwatchlive/frontend/src/config/validEnvs";
import { execCommandAsPromise } from "shared/scripts/execCommandAsPromise";

const addWAFOutputToEnvVariables = async (options: {
  stage: string | undefined;
}) => {
  // should matched with serverless.yaml of cwl-waf
  const WAF_OUTPUT_NAMES = ["CloudFrontWAFArn"];
  // log current path
  console.log("Current path:", process.cwd());
  const WAFOutputPath = path.resolve("/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cwl-waf/WAF_output.json");
  console.log("WAFOutputPath", WAFOutputPath);
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

const parseDeployArgs = async (allowedStages: string[]) => {
  return yargs(hideBin(process.argv))
    .option("stage", {
      alias: "s",
      type: "string",
      description: "serverless stage",
      requiresArg: true,
      choices: allowedStages,
    })
    .option("output-only", {
      alias: "oo",
      type: "boolean",
      description: "only copy sls output to slsOutput.json",
    })
    .option("skip-fe-build", {
      type: "boolean",
      description: `If deploy with frontend and this flag set to true, skip frontend build process`,
    })
    .option("frontend", {
      alias: "fe",
      type: "boolean",
      description: "includes frontend deployment",
    })
    .option("verbose", {
      type: "boolean",
      description: "forward verbose flag to serverless",
    })
    .parse();
};

type OutputOption = {
  OUTPUT_PATH: string;
  OUTPUT_KEYS: string[];
  consoleLog?: boolean;
};
export const deploySlsBackend = async (options: {
  hasFrontendDeployment: boolean;
  // if defined => has output from sls
  outputs?: OutputOption[];
  WAF?: boolean;
  allowedStages?: ValidEnv[];
}) => {
  const argv = await parseDeployArgs(
    options.allowedStages || Array.from(validEnvironments),
  );

  if (options.WAF) {
    addWAFOutputToEnvVariables({
      stage: argv.stage,
    });
  }

  const STAGE = argv.stage;
  const OUTPUT_ONLY = argv.outputOnly;
  const INCLUDE_FRONTEND = !!argv.frontend && !!options.hasFrontendDeployment;
  const VERBOSE = argv.verbose ? "--verbose" : "";
  if (!STAGE) {
    throw Error("Must specify stage with --stage option");
  }

  // https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#loading-environment-variables
  // value defined in process.env will override any value defined in .env files
  process.env.NEXT_PUBLIC_ENVIRONMENT = STAGE;

  const deploySls = async (
    deployOptions: {
      skipNextJSBuild?: boolean;
    } = {},
  ) => {
    if (OUTPUT_ONLY) {
      return;
    }
    console.log("Deploying to stage:", STAGE);

    if (INCLUDE_FRONTEND) {
      if (!deployOptions.skipNextJSBuild) {
        console.log("Deleteing cache...");
        await execCommandAsPromise(`cd ../frontend && rm -rf .next`);
        console.log("Building Next.js app...");
        // after finish the previous command, we are back to backend folder
        // so need to cd ../frontend again
        await execCommandAsPromise(`cd ../frontend && yarn build`);
      }
      console.log("Deploying serverless...");
      await execCommandAsPromise(`npx sls deploy --stage ${STAGE} ${VERBOSE}`);
    } else {
      console.log("Deploying serverless...");
      if (!options.hasFrontendDeployment) {
        await execCommandAsPromise(
          `npx sls deploy --stage ${STAGE} ${VERBOSE}`,
        );
      } else {
        await execCommandAsPromise(
          `npx sls deploy --stage ${STAGE} --nos3sync ${VERBOSE}`,
        );
      }
    }
  };

  // since both frontend and backend are deployed together,
  // we may need to redeploy frontend again if slsOutput.json changed
  // slsOutputChanged flag will tell us if we need a second deployment or not
  const printSlsOutput = async (): Promise<{ slsOutputChanged: boolean }> => {
    if (!options.outputs || options.outputs.length === 0) {
      return { slsOutputChanged: false };
    }

    let slsOutputChanged = false;
    const outputFromSls = await execCommandAsPromise(
      `npx sls output list --stage ${STAGE}`,
      { captureStdOut: true },
    );
    const outputLines = outputFromSls.split("\n");

    console.log("Writing sls output...");
    options.outputs.forEach((outputOption) => {
      const { OUTPUT_PATH, OUTPUT_KEYS } = outputOption;

      // read current json file and overwrite new values
      if (!fs.existsSync(OUTPUT_PATH)) {
        fs.writeFileSync(OUTPUT_PATH, "{}", "utf8");
      }
      const SLS_OUTPUT_JSON = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
      if (!SLS_OUTPUT_JSON[STAGE]) {
        SLS_OUTPUT_JSON[STAGE] = {};
      }

      outputLines.forEach((outputLine) => {
        const [key, ...splitValue] = outputLine.split(": ");
        const newValue = splitValue.join(": ");
        if (OUTPUT_KEYS.includes(key)) {
          const oldValue = SLS_OUTPUT_JSON[STAGE][key];
          if (oldValue !== newValue) {
            slsOutputChanged = true;
          }
          SLS_OUTPUT_JSON[STAGE][key] = newValue;
        }
      });

      fs.writeFileSync(
        OUTPUT_PATH,
        JSON.stringify(SLS_OUTPUT_JSON, null, 2),
        "utf8",
      );
      if (outputOption.consoleLog) {
        console.log(
          `sls output (stage ${STAGE}):`,
          JSON.stringify(SLS_OUTPUT_JSON[STAGE], null, 2),
        );
      }

      console.log("sls output updated to", OUTPUT_PATH);
    });

    return { slsOutputChanged };
  };

  // 1. deploy
  await deploySls({
    skipNextJSBuild: argv.skipFeBuild,
  });

  // 2. write output to slsOutput.json
  const { slsOutputChanged } = await printSlsOutput();

  // 3. In case of frontend deployment
  if (INCLUDE_FRONTEND) {
    // 3a. slsOutput.json changed => redeploy again to update with changed value
    if (slsOutputChanged) {
      console.log("slsOutput.json changed, redeploying frontend...");
      await deploySls({ skipNextJSBuild: true });
    }

    // 3b. cloud front invalidation
    console.log("Invoking post frontend deployment function");
    await execCommandAsPromise(
      `npx sls invoke --function postFrontEndDeploy --stage ${STAGE}`,
    );
  }
};