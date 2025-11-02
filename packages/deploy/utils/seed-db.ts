import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { logger } from "./logger";

export interface SeedDBOptions {
  region: string;
  tableName: string;
  stage: string;
  // optional application package folder name, e.g. 'aws-example' or 'cloudwatchlive'
  appName?: string;
  numCompanies?: number;
  adminsPerCompany?: number;
  staffPerAdmin?: number;
  superAdminUserId?: string;
  // Additional arbitrary positional args to pass to the per-package seeder
  extraArgs?: string[];
  // Additional environment variables to set when running the seeder
  extraEnv?: Record<string, string>;
  skipConfirmation?: boolean;
  // If true, do not actually spawn tsx; just resolve the script path and log the invocation.
  dryRun?: boolean;
}

export async function seedDB(options: SeedDBOptions): Promise<void> {
  const {
    region,
    tableName,
    stage,
    numCompanies,
    adminsPerCompany,
    staffPerAdmin,
    superAdminUserId,
    extraArgs,
    extraEnv,
    skipConfirmation = false,
    appName = "aws-example",
    dryRun = false,
  } = options;

  logger.info(`🌱 Seeding data for app: ${appName}`);
  logger.info(`Region: ${region}`);
  logger.info(`Table: ${tableName}`);
  logger.info(`Stage: ${stage}`);
  if (typeof numCompanies === "number") {
    logger.info(`Event Companies: ${numCompanies}`);
  }
  if (typeof adminsPerCompany === "number") {
    logger.info(`Admins per Company: ${adminsPerCompany}`);
  }
  if (typeof staffPerAdmin === "number") {
    logger.info(`Staff per Admin: ${staffPerAdmin}`);
  }
  if (
    typeof numCompanies === "number" &&
    typeof adminsPerCompany === "number" &&
    typeof staffPerAdmin === "number"
  ) {
    const totalUsers =
      numCompanies * (1 + adminsPerCompany + adminsPerCompany * staffPerAdmin);
    logger.info(`Total Users: ~${totalUsers}`);
  }

  if (!skipConfirmation) {
    logger.warning("This will create test data in your DynamoDB table.");
    logger.warning("Press Ctrl+C to cancel, or wait 5 seconds to continue...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  logger.info("Starting seed process...");

  // Resolve per-package seeder script. Try typical names in order.
  const candidates = [
    `../../${appName}/backend/scripts/seed-db.ts`,
    `../../${appName}/backend/scripts/seed.ts`,
    `../../${appName}/backend/scripts/seed-db.js`,
  ];

  let scriptPath: string | null = null;
  for (const rel of candidates) {
    const abs = path.resolve(__dirname, rel);
    if (fs.existsSync(abs)) {
      scriptPath = abs;
      break;
    }
  }

  if (!scriptPath) {
    const tried = candidates.map((c) => path.resolve(__dirname, c)).join("\n");
    throw new Error(
      `No seed script found for app '${appName}'. Tried:\n${tried}`,
    );
  }

  logger.info(`Using seeder script: ${scriptPath}`);

  const env = {
    ...process.env,
    AWS_REGION: region,
    TABLE_NAME: tableName,
    STAGE: stage,
  };

  const args: string[] = [scriptPath];

  if (typeof numCompanies === "number") {
    args.push(numCompanies.toString());
  }
  if (typeof adminsPerCompany === "number") {
    args.push(adminsPerCompany.toString());
  }
  if (typeof staffPerAdmin === "number") {
    args.push(staffPerAdmin.toString());
  }
  if (superAdminUserId) {
    args.push(superAdminUserId);
  }
  // Append any extra positional args requested by caller
  if (extraArgs && extraArgs.length > 0) {
    args.push(...extraArgs.map((a) => String(a)));
  }

  // Merge extraEnv (caller-specified env vars) without removing previously set vars
  const runEnv = { ...env, ...(extraEnv || {}) };

  if (dryRun) {
    logger.info("Dry-run enabled: not spawning tsx.");
    logger.info(
      `Would run: tsx ${args.map((a) => JSON.stringify(a)).join(" ")}`,
    );
    logger.info(
      `With env: AWS_REGION=${runEnv.AWS_REGION}, TABLE_NAME=${runEnv.TABLE_NAME}, STAGE=${runEnv.STAGE}`,
    );
    if (extraEnv && Object.keys(extraEnv).length > 0) {
      logger.info(`Extra env: ${JSON.stringify(extraEnv)}`);
    }
    if (extraArgs && extraArgs.length > 0) {
      logger.info(`Extra args: ${JSON.stringify(extraArgs)}`);
    }
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const tsxProcess = spawn("tsx", args, {
      env: runEnv,
      stdio: ["inherit", "pipe", "pipe"],
    });

    // Capture and log stdout
    tsxProcess.stdout?.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      // Also log to console in real-time
      process.stdout.write(text);
      // Log to our logger
      logger.info(text.trim());
    });

    // Capture and log stderr
    tsxProcess.stderr?.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      // Also log to console in real-time
      process.stderr.write(text);
      // Log to our logger
      logger.error(text.trim());
    });

    tsxProcess.on("close", (code) => {
      if (code === 0) {
        logger.success("✅ User seeding completed successfully");
        resolve();
      } else {
        logger.error(`❌ Seed process exited with code ${code}`);
        if (stderr) {
          logger.error(`Stderr output: ${stderr}`);
        }
        if (stdout) {
          logger.debug(`Stdout output: ${stdout}`);
        }
        reject(
          new Error(
            `Seed process failed with code ${code}${stderr ? ": " + stderr.slice(0, 200) : ""}`,
          ),
        );
      }
    });

    tsxProcess.on("error", (error) => {
      logger.error(`❌ Failed to start seed process: ${error.message}`);
      reject(error);
    });
  });
}
