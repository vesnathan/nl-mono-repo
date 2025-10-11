import { config } from "dotenv";
import path from "path";
import { deployShared } from "./packages/shared/shared";
import { deployWaf } from "./packages/waf/waf";
import { deployCwl } from "./packages/cwl/cwl";
import { deployAwsExample } from "./packages/aws-example/aws-example";
import { OutputsManager } from "./outputs-manager";
import { getDependencyChain } from "./dependency-validator";
import { StackType } from "./types";
import { logger } from "./utils/logger";
import inquirer from "inquirer";

// Load environment variables from mono-repo root
config({ path: path.resolve(__dirname, "../../.env") });

// Function to prompt for stage selection with a timeout
async function promptStageSelection(
  timeout: number,
  defaultValue: string,
): Promise<string> {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;
    let isResolved = false;

    // Create prompt interface
    const prompt = inquirer.prompt([
      {
        type: "list",
        name: "stage",
        message: `Select deployment stage (defaults to "${defaultValue}" in ${timeout / 1000} seconds):`,
        choices: [
          { name: "Development Environment", value: "dev" },
          // Add more environments here when needed
          // { name: 'Production Environment', value: 'prod' }
        ],
        default: defaultValue,
      },
    ]);

    // Handle the prompt result
    prompt.then((answers) => {
      if (!isResolved) {
        clearTimeout(timeoutId);
        isResolved = true;
        resolve(answers.stage);
      }
    });

    // Set timeout to auto-select default value
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        // Simulate user pressing Enter to select default option
        process.stdin.emit("keypress", "\n");
        logger.info(
          `\nNo selection made after ${timeout / 1000} seconds, using default: ${defaultValue}`,
        );
        resolve(defaultValue);
      }
    }, timeout);
  });
}

async function promptDeploymentOptions(): Promise<{
  stackUpdateStrategy: "update" | "recreate";
  createAdminUser: boolean;
}> {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "stackUpdateStrategy",
      message: "Select stack deployment strategy:",
      choices: [
        { name: "Update existing stacks if they exist", value: "update" },
        { name: "Recreate stacks (delete then create)", value: "recreate" },
      ],
      default: "update",
    },
    {
      type: "confirm",
      name: "createAdminUser",
      message: "Create admin user?",
      default: true,
    },
  ]);
  return answers;
}

async function deployAll() {
  try {
    // Set default region if not set
    if (!process.env.AWS_REGION) {
      process.env.AWS_REGION = "ap-southeast-2";
      logger.info(
        `AWS_REGION not set, defaulting to ${process.env.AWS_REGION}`,
      );
    }

    // Prompt for stage selection with 10-second timeout defaulting to "dev"
    const stage = await promptStageSelection(10000, "dev");
    logger.info(`Using deployment stage: ${stage}`);

    // Prompt for other deployment options
    const { stackUpdateStrategy, createAdminUser } =
      await promptDeploymentOptions();
    logger.info(`Stack update strategy: ${stackUpdateStrategy}`);
    logger.info(`Create admin user: ${createAdminUser}`);

    const deploymentOptions = {
      stage,
      autoDeleteFailedStacks: true, // Enable automatic cleanup of failed stacks
      stackUpdateStrategy, // Added option
      createAdminUser, // Added option
    };

    const outputsManager = new OutputsManager();

    // Deploy the dependency chain for CWL (WAF -> Shared -> CWL)
    const cwlChain = getDependencyChain(StackType.CWL);
    logger.info(`CWL dependency chain: ${cwlChain.join(" → ")}`);
    for (const stack of cwlChain) {
      const exists = await outputsManager.validateStackExists(
        stack,
        deploymentOptions.stage,
      );
      if (exists) {
        logger.info(`Skipping ${stack} — already deployed`);
        continue;
      }

      logger.info(`Deploying ${stack}...`);
      if (stack === StackType.WAF) {
        await deployWaf({ ...deploymentOptions });
      } else if (stack === StackType.Shared) {
        await deployShared({ ...deploymentOptions });
      } else if (stack === StackType.CWL) {
        await deployCwl(deploymentOptions);
      }
      logger.success(`${stack} deployed`);
    }

    // Deploy aws-example and its dependencies (e.g., Shared)
    const exampleChain = getDependencyChain(StackType.AwsExample);
    logger.info(`aws-example dependency chain: ${exampleChain.join(" → ")}`);
    for (const stack of exampleChain) {
      const exists = await outputsManager.validateStackExists(
        stack,
        deploymentOptions.stage,
      );
      if (exists) {
        logger.info(`Skipping ${stack} — already deployed`);
        continue;
      }

      logger.info(`Deploying ${stack}...`);
      if (stack === StackType.WAF) {
        await deployWaf({ ...deploymentOptions });
      } else if (stack === StackType.Shared) {
        await deployShared({ ...deploymentOptions });
      } else if (stack === StackType.CWL) {
        await deployCwl(deploymentOptions);
      } else if (stack === StackType.AwsExample) {
        await deployAwsExample(deploymentOptions);
      }
      logger.success(`${stack} deployed`);
    }

    logger.success("All deployments completed successfully");
  } catch (error: unknown) {
    logger.error(
      `Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    logger.error(
      `Error stack: ${error instanceof Error ? error.stack : "No stack available"}`,
    );
    process.exit(1);
  }
}

deployAll();
