import { spawn } from "child_process";
import * as path from "path";
import { logger } from "./logger";

export interface SeedUsersOptions {
  region: string;
  tableName: string;
  stage: string;
  numCompanies?: number;
  adminsPerCompany?: number;
  staffPerAdmin?: number;
  superAdminUserId?: string;
  skipConfirmation?: boolean;
}

export async function seedCWLUsers(options: SeedUsersOptions): Promise<void> {
  const {
    region,
    tableName,
    stage,
    numCompanies = 5,
    adminsPerCompany = 3,
    staffPerAdmin = 5,
    superAdminUserId,
    skipConfirmation = false,
  } = options;

  const totalUsers =
    numCompanies * (1 + adminsPerCompany + adminsPerCompany * staffPerAdmin);

  logger.info(`🌱 Seeding CWL Users`);
  logger.info(`Region: ${region}`);
  logger.info(`Table: ${tableName}`);
  logger.info(`Stage: ${stage}`);
  logger.info(`Event Companies: ${numCompanies}`);
  logger.info(`Admins per Company: ${adminsPerCompany}`);
  logger.info(`Staff per Admin: ${staffPerAdmin}`);
  logger.info(`Total Users: ~${totalUsers}`);

  if (!skipConfirmation) {
    logger.warning("This will create test data in your DynamoDB table.");
    logger.warning("Press Ctrl+C to cancel, or wait 5 seconds to continue...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  logger.info("Starting seed process...");

  const scriptPath = path.resolve(
    __dirname,
    "../../cloudwatchlive/backend/scripts/seed-users.ts",
  );

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      AWS_REGION: region,
      TABLE_NAME: tableName,
      STAGE: stage,
    };

    const args = [
      scriptPath,
      numCompanies.toString(),
      adminsPerCompany.toString(),
      staffPerAdmin.toString(),
    ];

    if (superAdminUserId) {
      args.push(superAdminUserId);
    }

    const tsxProcess = spawn("tsx", args, {
      env,
      stdio: "inherit",
    });

    tsxProcess.on("close", (code) => {
      if (code === 0) {
        logger.success("✅ User seeding completed successfully");
        resolve();
      } else {
        logger.error(`❌ Seed process exited with code ${code}`);
        reject(new Error(`Seed process failed with code ${code}`));
      }
    });

    tsxProcess.on("error", (error) => {
      logger.error(`❌ Failed to start seed process: ${error.message}`);
      reject(error);
    });
  });
}
