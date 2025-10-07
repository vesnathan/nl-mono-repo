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

  // Use Amplify codegen to generate types locally, then move to shared package
  const command = `npx amplify codegen types --schema combined_schema.graphql --debug`;
  await execCommandAsPromise(command);

  // Move generated file to shared package
  const fs = require('fs');
  const src = path.resolve('types/gqlTypes.ts');
  const dest = path.resolve('../../shared/types/gqlTypes.ts');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('GraphQL types copied to shared/types/gqlTypes.ts!');
  } else {
    console.error('GraphQL types were not generated!');
  }
};

buildGql().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
