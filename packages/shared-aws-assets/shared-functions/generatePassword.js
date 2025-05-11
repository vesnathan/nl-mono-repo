"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePassword = void 0;
const validator_1 = __importDefault(require("validator"));
const generatePassword = (useUpperCharacters, useLowerCharacters, useSpecialCharacters, useNumericCharacters, passwordLength) => {
    let charSetToUse = "";
    let generatedPassword = "";
    const config = {};
    if (useUpperCharacters) {
        charSetToUse += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        config.minUppercase = 1;
    }
    if (useLowerCharacters) {
        charSetToUse += "abcdefghijklmnopqrstuvwxyz";
        config.minLowercase = 1;
    }
    if (useSpecialCharacters) {
        charSetToUse += "!%+-=?@";
        config.minSymbols = 1;
    }
    if (useNumericCharacters) {
        charSetToUse += "0123456789";
        config.minNumbers = 1;
    }
    while (!validator_1.default.isStrongPassword(generatedPassword, config)) {
        generatedPassword = "";
        for (let i = 0; i < passwordLength; i += 1) {
            generatedPassword += charSetToUse.charAt(Math.floor(Math.random() * charSetToUse.length));
        }
    }
    return generatedPassword;
};
exports.generatePassword = generatePassword;
