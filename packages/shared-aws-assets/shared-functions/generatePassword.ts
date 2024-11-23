import Validator from "validator";

export const generatePassword = (
  useUpperCharacters: boolean,
  useLowerCharacters: boolean,
  useSpecialCharacters: boolean,
  useNumericCharacters: boolean,
  passwordLength: number,
) => {
  let charSetToUse = "";
  let generatedPassword = "";
  const config: validator.StrongPasswordOptions & {
    returnScore?: false | undefined;
  } = {};

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

  while (!Validator.isStrongPassword(generatedPassword, config)) {
    generatedPassword = "";
    for (let i = 0; i < passwordLength; i += 1) {
      generatedPassword += charSetToUse.charAt(
        Math.floor(Math.random() * charSetToUse.length),
      );
    }
  }
  return generatedPassword;
};
