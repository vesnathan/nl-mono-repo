#!/usr/bin/env node
import { config } from "dotenv";
import { deployCwl } from "./packages/cwl/deploy";
import { logger } from "./utils/logger";

// Load environment variables
config({ path: "../../.env" });

async function main() {
  const stage = process.argv[2] || "dev";
  const region = process.env.AWS_REGION || "ap-southeast-2";

  logger.info(`Deploying CWL stack for stage: ${stage}, region: ${region}`);

  try {
    await deployCwl({
      stage,
      region,
      adminEmail: process.argv[3], // Optional admin email
    });
    logger.success("CWL stack deployed successfully!");
  } catch (error: any) {
    logger.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

main();
