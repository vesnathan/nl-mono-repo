"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const buildGqlTypesOnBackend_1 = require("shared/scripts/buildGqlTypesOnBackend");
const buildGql = async () => {
    await (0, buildGqlTypesOnBackend_1.buildGqlTypesOnBackend)({
        INPUT_DIRS: [
            path_1.default.resolve("scripts/customAppsyncTypes.graphql"),
        ],
        COMBINED_FILE_PATH: path_1.default.resolve("combined_schema.graphql"),
        OUTPUT_TYPES_PATH: path_1.default.resolve("resources/gqlTypes.ts"),
    });
};
buildGql().catch((err) => {
    console.error(err);
    process.exit(1);
});
