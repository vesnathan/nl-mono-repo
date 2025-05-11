"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUserInput = sanitizeUserInput;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const unescape_1 = __importDefault(require("lodash/unescape"));
/**
 * Recursively loop through input object and sanitize all string values
 */
function sanitizeUserInput(userInput) {
    if (Array.isArray(userInput)) {
        return userInput.map((value) => sanitizeUserInput(value));
    }
    if (userInput !== null && typeof userInput === "object") {
        return Object.fromEntries(Object.entries(userInput).map(([key, value]) => [
            key,
            sanitizeUserInput(value),
        ]));
    }
    if (typeof userInput === "string") {
        return (0, sanitize_html_1.default)(userInput, {
            allowedTags: [], // do not allow any html tags
            textFilter: (text) => (0, unescape_1.default)(text), // unescape html entities (e.g convert &amp; back to &)
        });
    }
    return userInput;
}
