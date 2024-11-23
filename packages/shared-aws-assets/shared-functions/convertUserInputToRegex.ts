import escapeStringRegexp from "escape-string-regexp";

export const convertUserInputToRegex = (userInput: string): RegExp => {
  if (userInput.length > 50) {
    throw Error(`256.123: "${userInput}" is too long for regex match`);
  }
  return new RegExp(escapeStringRegexp(userInput), "i")
};
