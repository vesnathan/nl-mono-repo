import fs from "fs";
import path from "path";
import { execCommandAsPromise } from "shared/scripts/execCommandAsPromise";
import { mergeGraphqlFiles } from "shared/scripts/mergeGraphqlFiles";

const buildGql = async () => {
  mergeGraphqlFiles({
    INPUT_DIRS: [path.resolve("../backend/schema")],
    OUTPUT_FILE_PATH: path.resolve("../backend/combined_schema.graphql"),
  });

  const schemaPath = path.resolve("../backend/combined_schema.graphql");
  const amplifyTypesCmd = `npx amplify codegen types --schema ${schemaPath} --debug`;

  let generated = false;
  try {
    await execCommandAsPromise(amplifyTypesCmd, { captureStdOut: true });
    generated = true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("amplify codegen types failed:", err);

    if (process.env.AMPLIFY_CODEGEN_ADD_AUTO === "true") {
      try {
        // eslint-disable-next-line no-console
        console.info(
          "Running 'amplify codegen add' because AMPLIFY_CODEGEN_ADD_AUTO=true",
        );
        await execCommandAsPromise("npx amplify codegen add");
        await execCommandAsPromise(amplifyTypesCmd, { captureStdOut: true });
        generated = true;
      } catch (addErr) {
        // eslint-disable-next-line no-console
        console.warn("'amplify codegen add' failed:", addErr);
      }
    } else {
      // eslint-disable-next-line no-console
      console.info(
        "amplify codegen not configured; falling back to graphql-codegen",
      );
    }
  }

  if (!generated) {
    try {
      const outDir = path.resolve(__dirname, "../src/types");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const tmpConfigPath = path.resolve(__dirname, "../codegen.temp.yml");
      const yaml = `schema: "${schemaPath}"\ngenerates:\n  ./src/types/gqlTypes.ts:\n    plugins:\n      - typescript\n      - typescript-operations\n    config: {}\n`;
      fs.writeFileSync(tmpConfigPath, yaml, "utf8");
      // eslint-disable-next-line no-console
      console.info(
        "Running graphql-codegen fallback to generate src/types/gqlTypes.ts",
      );
      await execCommandAsPromise(
        `npx --yes @graphql-codegen/cli generate --config ${tmpConfigPath}`,
      );
      try {
        fs.unlinkSync(tmpConfigPath);
      } catch {
        /* ignore */
      }
    } catch (fallbackErr) {
      // eslint-disable-next-line no-console
      console.warn("graphql-codegen fallback failed:", fallbackErr);
    }
  }
};

buildGql();
