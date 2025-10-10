import path from "path";
import { execCommandAsPromise } from "shared/scripts/execCommandAsPromise";
import { mergeGraphqlFiles } from "shared/scripts/mergeGraphqlFiles";

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
  }
};

buildGql();
