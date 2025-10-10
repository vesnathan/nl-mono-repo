import fs from "fs";
import path from "path";
import { execCommandAsPromise } from "shared/scripts/execCommandAsPromise";
import { mergeGraphqlFiles } from "shared/scripts/mergeGraphqlFiles";

// eslint-disable-next-line sonarjs/cognitive-complexity
const buildGql = async () => {
  // Merge GraphQL schema files from their source locations:
  // - Operations (Query/Mutation): backend/schema/
  // - Types (AWSBUser, etc.): shared/types/
  mergeGraphqlFiles({
    INPUT_DIRS: [path.resolve("../backend/schema")],
    // Output to backend as the single source of truth for deployment
    OUTPUT_FILE_PATH: path.resolve("../backend/combined_schema.graphql"),
  });

  const schemaPath = path.resolve("../backend/combined_schema.graphql");
  const command = `npx amplify codegen types --schema ${schemaPath} --debug`;
  try {
    await execCommandAsPromise(command);
  } catch (err) {
    // amplify codegen may not be configured in every package (e.g. CI or example projects).
    // Don't fail the whole build when codegen isn't setup — warn and continue.
    // eslint-disable-next-line no-console
    console.warn(
      "amplify codegen failed or is not configured in this package:",
      err && typeof err === "object" && "message" in err
        ? (err as { message?: string }).message
        : err,
    );

    // Fallback: try to generate types using graphql-codegen (non-amplify).
    // This ensures example packages (which may not have Amplify configured)
    // still produce `src/types/gqlTypes.ts` for linting/build purposes.
    try {
      const outDir = path.resolve(__dirname, "../src/types");
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const tmpConfigPath = path.resolve(__dirname, "../codegen.temp.yml");
      const yaml = `schema: "${schemaPath}"
generates:
  ./src/types/gqlTypes.ts:
    plugins:
      - typescript
      - typescript-operations
    config: {}
`;
      fs.writeFileSync(tmpConfigPath, yaml, "utf8");

      // Run graphql-codegen via npx. Use --yes to auto-accept and reduce CI noise.
      const codegenCmd = `npx --yes @graphql-codegen/cli generate --config ${tmpConfigPath}`;
      // eslint-disable-next-line no-console
      console.info(
        "amplify not configured: attempting graphql-codegen fallback...",
      );
      await execCommandAsPromise(codegenCmd);
      // Clean up temporary config
      try {
        fs.unlinkSync(tmpConfigPath);
      } catch (error) {
        // consume the error variable so linters don't complain about unused vars
        if (error) {
          /* ignore */
        }
      }
    } catch (fallbackErr) {
      // eslint-disable-next-line no-console
      console.warn(
        "graphql-codegen fallback failed:",
        fallbackErr &&
          typeof fallbackErr === "object" &&
          "message" in fallbackErr
          ? (fallbackErr as { message?: string }).message
          : fallbackErr,
      );
    }
  }
};

buildGql();
