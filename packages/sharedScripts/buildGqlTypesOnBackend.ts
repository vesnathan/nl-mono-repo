import { generateTypeScriptTypes } from "graphql-schema-typescript";
import { mergeGraphqlFiles } from "./mergeGraphqlFiles";

export const buildGqlTypesOnBackend = async (options: {
  INPUT_DIRS: string[];
  COMBINED_FILE_PATH: string;
  OUTPUT_TYPES_PATH: string;
}) => {
  // recursively look through schema folder and grab files ended with .graphql
  // and merge them together into one file and .gitignore it.
  // Make sure to not write them under same folder where we look for smaller .graphql files, otherwise
  // the combined file will be duplicated in subsequence build
  const { COMBINED_FILE_PATH, INPUT_DIRS, OUTPUT_TYPES_PATH } = options;
  mergeGraphqlFiles({
    INPUT_DIRS,
    // the output file is then used by graphql-schema-typescript to generate backend types
    OUTPUT_FILE_PATH: COMBINED_FILE_PATH,
  });

  await generateTypeScriptTypes(
    COMBINED_FILE_PATH,
    OUTPUT_TYPES_PATH,
    {
      typePrefix: "",
      customScalarType: {
        AWSDate: "string",
        AWSTime: "string",
        AWSDateTime: "string",
        AWSTimestamp: "number",
        AWSEmail: "string",
        AWSJSON: "any",
        AWSPhone: "string",
        AWSURL: "string",
        AWSIPAddress: "string",
      },
    },
    {
      // assumeValidSDL: true,
      // assumeValid: true,
    },
  );
  console.log(`Types generated at ${OUTPUT_TYPES_PATH}`);
};
