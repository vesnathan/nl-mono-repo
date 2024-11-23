import path from "path";
import { buildGqlTypesOnBackend } from "../../../shared/scripts/buildGqlTypesOnBackend";
const buildGql = async () => {
  await buildGqlTypesOnBackend({
    INPUT_DIRS: [
      path.resolve("resources/AppSync"),
      path.resolve("../../wcl-types/graphql"),
      path.resolve("scripts/customAppsyncTypes.graphql"),
    ],
    COMBINED_FILE_PATH: path.resolve("combined_schema.graphql"),
    OUTPUT_TYPES_PATH: path.resolve("resources/AppSync/resolvers/gqlTypes.ts"),
  });
};

buildGql().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
