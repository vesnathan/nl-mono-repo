"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
class Logger {
    info(message) {
        console.log(chalk_1.default.blue('ℹ'), message);
    }
    success(message) {
        console.log(chalk_1.default.green('✓'), message);
    }
    warning(message) {
        console.log(chalk_1.default.yellow('⚠'), message);
    }
    error(message) {
        console.log(chalk_1.default.red('✗'), message);
    }
    debug(message) {
        if (process.env.DEBUG) {
            console.log(chalk_1.default.gray('🔍'), message);
        }
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
