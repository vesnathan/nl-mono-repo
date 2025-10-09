#!/usr/bin/env tsx

import {
  CloudFormationClient,
  ListExportsCommand,
} from "@aws-sdk/client-cloudformation";
import { seedCWLUsers } from "./utils/seed-users";
import { logger } from "./utils/logger";

async function main() {
  try {
    const stage = process.env.STAGE || process.argv[2] || "dev";
    const region = process.env.AWS_REGION || "ap-southeast-2";
    const skipConfirmation =
      process.argv.includes("--yes") || process.argv.includes("-y");

    logger.info(`🌱 CWL Database Seeding - ${stage.toUpperCase()}`);

    // Get CloudFormation exports
    const cfnClient = new CloudFormationClient({ region });
    const exportsResponse = await cfnClient.send(new ListExportsCommand({}));

    const exports = exportsResponse.Exports || [];
    const tableNameExport = exports.find(
      (exp) => exp.Name === `cwlUserTableName-${stage}`,
    );

    if (!tableNameExport || !tableNameExport.Value) {
      logger.error(`❌ Could not find table export: cwlUserTableName-${stage}`);
      logger.info("Make sure CWL stack is deployed first.");
      process.exit(1);
    }

    const tableName = tableNameExport.Value;

    await seedCWLUsers({
      region,
      tableName,
      stage,
      numCompanies: 5,
      adminsPerCompany: 3,
      staffPerAdmin: 5,
      skipConfirmation,
    });

    logger.success("🎉 Seeding completed successfully!");
  } catch (error) {
    logger.error("❌ Seeding failed:");
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
