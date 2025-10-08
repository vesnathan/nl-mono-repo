import path from "path";
import { execCommandAsPromise } from "shared/scripts/execCommandAsPromise";
import { mergeGraphqlFiles } from "shared/scripts/mergeGraphqlFiles";

const buildGql = async () => {
  // recursively look through schema folder and grab files ended with .graphql
  // and merge them together into one file and .gitignore it.
  // Make sure to not write them under same folder where we look for smaller .graphql files, otherwise
  // the combined file will be duplicated in subsequence build
  mergeGraphqlFiles({
    INPUT_DIRS: [
      path.resolve("../backend/resources/AppSync"),
      path.resolve("../shared/types"),
    ],
    // the output file is then used by amplify codegen defined in `.graphqlconfig.yml`
    OUTPUT_FILE_PATH: path.resolve("../backend/combined_schema.graphql"),
  });
  const command = `npx amplify codegen types --schema ../backend/combined_schema.graphql --debug`; // Explicitly pass schema
  await execCommandAsPromise(command);
};

buildGql();
