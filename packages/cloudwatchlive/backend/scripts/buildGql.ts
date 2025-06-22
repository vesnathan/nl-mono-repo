import path from "path";
import { execCommandAsPromise } from "../../../shared/scripts/execCommandAsPromise";
import { mergeGraphqlFiles } from "../../../shared/scripts/mergeGraphqlFiles";

const buildGql = async () => {
  console.log("Building GraphQL types for backend using Amplify codegen...");
  
  // Merge GraphQL schema files (same approach as frontend)
  mergeGraphqlFiles({
    INPUT_DIRS: [
      path.resolve("resources/AppSync"),
      path.resolve("../shared/types"),
      path.resolve("scripts"),
    ],
    OUTPUT_FILE_PATH: path.resolve("combined_schema.graphql"),
  });

  // Use Amplify codegen instead of custom buildGqlTypesOnBackend
  const command = `npx amplify codegen types --schema combined_schema.graphql --debug`;
  await execCommandAsPromise(command);
  
  console.log("GraphQL types generated successfully!");
};

buildGql().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
