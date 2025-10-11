require("ts-node").register({ transpileOnly: true });
(async () => {
  try {
    const {
      LambdaCompiler,
    } = require("../packages/deploy/utils/lambda-compiler");
    const { logger } = require("../packages/deploy/utils/logger");
    const path = require("path");

    // Determine target app from CLI arg or APP_NAME env var
    const targetApp = process.argv[2] || process.env.APP_NAME;
    if (!targetApp) {
      console.error(
        "Usage: node scripts/compile-aws-lambdas.js <app-name>  OR set APP_NAME env var",
      );
      process.exit(1);
    }

    const lambdaSourceDir = path.join(
      process.cwd(),
      `packages/${targetApp}/backend/lambda`,
    );
    const lambdaOutputDir = path.join(
      process.cwd(),
      ".cache",
      "deploy",
      targetApp,
      "functions",
    );

    const lc = new LambdaCompiler({
      logger,
      baseLambdaDir: lambdaSourceDir,
      outputDir: lambdaOutputDir,
      debugMode: true,
    });

    await lc.compileLambdaFunctions();
    console.log("Lambda compile finished");
  } catch (e) {
    console.error("Lambda compile error", e);
    process.exit(1);
  }
})();
