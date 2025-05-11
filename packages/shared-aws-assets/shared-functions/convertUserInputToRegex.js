"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertUserInputToRegex = void 0;
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const convertUserInputToRegex = (userInput) => {
    if (userInput.length > 50) {
        throw Error(`256.123: "${userInput}" is too long for regex match`);
    }
    return new RegExp((0, escape_string_regexp_1.default)(userInput), "i");
};
exports.convertUserInputToRegex = convertUserInputToRegex;
