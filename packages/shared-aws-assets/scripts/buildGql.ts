import path from "path";
import { buildGqlTypesOnBackend } from "shared/scripts/buildGqlTypesOnBackend";

const buildGql = async () => {
  await buildGqlTypesOnBackend({
    INPUT_DIRS: [
      path.resolve("scripts/customAppsyncTypes.graphql"),
    ],
    COMBINED_FILE_PATH: path.resolve("combined_schema.graphql"),
    OUTPUT_TYPES_PATH: path.resolve("resources/gqlTypes.ts"),
  });
};

buildGql().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
