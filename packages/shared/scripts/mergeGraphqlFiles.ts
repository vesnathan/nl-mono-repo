/* eslint-disable security/detect-non-literal-fs-filename */
import fs from "fs";
import path from "path";

export const mergeGraphqlFiles = (options: {
  INPUT_DIRS: string[];
  OUTPUT_FILE_PATH: string;
}) => {
  const { INPUT_DIRS, OUTPUT_FILE_PATH } = options;

  // recursively look through schema folder and grab files ended with .graphql
  // and merge them together into one file
  function recursiveSearchFile(
    basePaths: string[],
    filterRegex: RegExp,
    fileNames: string[] = [],
  ) {
    // eslint-disable-next-line no-restricted-syntax
    for (const basePath of basePaths) {
      const fileStat = fs.statSync(basePath);
      if (fileStat.isDirectory()) {
        const directory = fs.readdirSync(basePath);
        directory.forEach((f) =>
          recursiveSearchFile([path.join(basePath, f)], filterRegex, fileNames),
        );
      } else if (filterRegex.test(basePath)) {
        fileNames.push(basePath);
      }
    }
    return fileNames;
  }
  const graphqlFiles = recursiveSearchFile(INPUT_DIRS, /\.graphql$/);

  const schemaDefs = graphqlFiles
    .map((fileName) => {
      return fs.readFileSync(fileName, "utf-8");
    })
    .join("\n");
  // write combined schema definition into one big file and .gitignore it.
  // Make sure to not write them under same folder where we look for smaller .graphql files, otherwise
  // the combined file will be duplicated in subsequence build
  fs.writeFileSync(OUTPUT_FILE_PATH, schemaDefs, "utf-8");
};
