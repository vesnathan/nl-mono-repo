import path from "path";
import { execCommandAsPromise } from "shared/scripts/execCommandAsPromise";
import { mergeGraphqlFiles } from "shared/scripts/mergeGraphqlFiles";

const buildGql = async () => {
  // Merge GraphQL schema files from their source locations:
  // - Operations (Query/Mutation): backend/schema/
  // - Types (CWLUser, etc.): shared/types/
  mergeGraphqlFiles({
    INPUT_DIRS: [
      path.resolve("../backend/schema"),
      path.resolve("../../shared/types"),
    ],
    // Output to backend as the single source of truth for deployment
    OUTPUT_FILE_PATH: path.resolve("../backend/combined_schema.graphql"),
  });

  const schemaPath = path.resolve("../backend/combined_schema.graphql");
  const command = `npx amplify codegen types --schema ${schemaPath} --debug`;
  await execCommandAsPromise(command);
};

buildGql();
