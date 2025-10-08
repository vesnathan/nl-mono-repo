import inquirer from "inquirer";
import { logger } from "./logger";
import { writeFileSync } from "fs";
import { join } from "path";
import { AwsCredentialIdentity } from "@aws-sdk/types";

export async function getAwsCredentials(): Promise<
  AwsCredentialIdentity | undefined
> {
  await configureAwsCredentials();

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return undefined;
}

export async function configureAwsCredentials(): Promise<void> {
  // Only ask for credentials if they're not already set or fail validation
  const validateExistingCredentials = async (): Promise<boolean> => {
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.AWS_ACCOUNT_ID
    ) {
      return false;
    }

    try {
      const {
        STSClient,
        GetCallerIdentityCommand,
      } = require("@aws-sdk/client-sts");
      const stsClient = new STSClient({ region: "us-east-1" });
      await stsClient.send(new GetCallerIdentityCommand({}));
      logger.success("Existing AWS credentials validated successfully");
      return true;
    } catch (error: any) {
      logger.warning(
        `Existing credentials failed validation: ${error.message}`,
      );
      return false;
    }
  };

  const isValid = await validateExistingCredentials();
  if (!isValid) {
    logger.info("Please enter your AWS credentials:");

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "accessKeyId",
        message: "AWS Access Key ID:",
        validate: (input: string) => {
          return input.length > 0 ? true : "Access Key ID cannot be empty";
        },
      },
      {
        type: "password",
        name: "secretAccessKey",
        message: "AWS Secret Access Key:",
        mask: "*",
        validate: (input: string) => {
          return input.length > 0 ? true : "Secret Access Key cannot be empty";
        },
      },
      {
        type: "input",
        name: "accountId",
        message: "AWS Account ID:",
        validate: (input: string) => {
          return /^\d{12}$/.test(input) ? true : "Account ID must be 12 digits";
        },
      },
    ]);

    // Set the credentials in environment variables
    process.env.AWS_ACCESS_KEY_ID = answers.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = answers.secretAccessKey;
    process.env.AWS_ACCOUNT_ID = answers.accountId;

    // Save credentials to the mono-repo root .env file
    try {
      const envContent = `AWS_ACCESS_KEY_ID=${answers.accessKeyId}
AWS_SECRET_ACCESS_KEY=${answers.secretAccessKey}
AWS_ACCOUNT_ID=${answers.accountId}`;
      const rootEnvPath = join(process.cwd(), "../../.env");
      writeFileSync(rootEnvPath, envContent);
      logger.success("AWS credentials saved to mono-repo root .env file");
    } catch (error) {
      logger.warning(
        "Could not save credentials to root .env file. They will only persist for this session.",
      );
    }

    // Validate the new credentials
    try {
      const {
        STSClient,
        GetCallerIdentityCommand,
      } = require("@aws-sdk/client-sts");
      const stsClient = new STSClient({ region: "us-east-1" });
      await stsClient.send(new GetCallerIdentityCommand({}));
      logger.success("AWS credentials configured and validated successfully");
    } catch (error: any) {
      logger.error(`Failed to validate AWS credentials: ${error.message}`);
      throw error;
    }
  }
}
