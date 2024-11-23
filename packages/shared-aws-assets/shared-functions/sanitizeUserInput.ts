import sanitizeHtml from "sanitize-html";
import unescape from "lodash/unescape";

/**
 * Recursively loop through input object and sanitize all string values
 */
export function sanitizeUserInput<T>(userInput: T): T {
  if (Array.isArray(userInput)) {
    return userInput.map((value) => sanitizeUserInput(value)) as T;
  }

  if (userInput !== null && typeof userInput === "object") {
    return Object.fromEntries(
      Object.entries(userInput).map(([key, value]) => [
        key,
        sanitizeUserInput(value),
      ]),
    ) as T;
  }

  if (typeof userInput === "string") {
    return sanitizeHtml(userInput, {
      allowedTags: [], // do not allow any html tags
      textFilter: (text) => unescape(text), // unescape html entities (e.g convert &amp; back to &)
    }) as T;
  }

  return userInput;
}
