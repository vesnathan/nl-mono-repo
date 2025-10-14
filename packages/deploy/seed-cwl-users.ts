#!/usr/bin/env tsx

import {
  CloudFormationClient,
  ListExportsCommand,
} from "@aws-sdk/client-cloudformation";
import { seedCWLDB } from "./utils/seed-users";
import { logger } from "./utils/logger";
import { OutputsManager } from "./outputs-manager";
import { candidateExportNames } from "./utils/export-names";
import { StackType } from "./types";

async function main() {
  try {
    const stage = process.env.STAGE || process.argv[2] || "dev";
    const region = process.env.AWS_REGION || "ap-southeast-2";
    const skipConfirmation =
      process.argv.includes("--yes") || process.argv.includes("-y");

    logger.info(`🌱 CWL Database Seeding - ${stage.toUpperCase()}`);

    // Prefer reading saved deployment outputs (parameterized names).
    const outputsManager = new OutputsManager();
    const candidates = candidateExportNames(
      StackType.CWL,
      stage,
      "datatable-name",
    );

    let tableName: string | undefined;

    try {
      tableName = await outputsManager.findOutputValueByCandidates(
        stage,
        candidates,
      ) || undefined;
    } catch (err) {
      // ignore and fall back to direct CFN export query
      tableName = undefined;
    }

    // Fallback to direct CloudFormation exports lookup (legacy behavior)
    if (!tableName) {
      const cfnClient = new CloudFormationClient({ region });
      const exportsResponse = await cfnClient.send(new ListExportsCommand({}));
      const exports = exportsResponse.Exports || [];

      // Look for any export that matches our candidate names, or the legacy
      // cwlUserTableName-{stage} export name used historically.
      const legacyName = `cwlUserTableName-${stage}`;
      const matched = exports.find(
        (exp) =>
          (exp.Name && candidates.includes(exp.Name)) || exp.Name === legacyName,
      );

      if (!matched || !matched.Value) {
        logger.error(
          `❌ Could not find table export (candidates: ${candidates.join(", ")}, legacy: ${legacyName})`,
        );
        logger.info("Make sure CWL stack is deployed first.");
        process.exit(1);
      }

      tableName = matched.Value;
    }

    await seedCWLDB({
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
