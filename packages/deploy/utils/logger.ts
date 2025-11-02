import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";

// Ensure debug mode starts as false
let isDebugModeEnabled = false;

// Log file path - can be set externally
let logFilePath: string | null = null;
let logFileStream: fs.WriteStream | null = null;

// Helper function to get formatted timestamp in local timezone
const getTimestamp = (): string => {
  const now = new Date();
  // Format: HH:MM:SS.mmm (24-hour format with milliseconds)
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${ms}`;
};

// Helper function to get ISO timestamp for log files
const getISOTimestamp = (): string => {
  return new Date().toISOString();
};

// Helper function to write to log file
const writeToLogFile = (level: string, message: string): void => {
  if (logFileStream) {
    const logEntry = `[${getISOTimestamp()}] [${level}] ${message}\n`;
    logFileStream.write(logEntry);
  }
};

// Spinner animation frames - classic cursor style
const spinnerFrames = ["|", "/", "-", "\\"];
let currentSpinnerFrame = 0;
let spinnerInterval: NodeJS.Timeout | null = null;

const createSpinner = (message: string): (() => void) => {
  const timestamp = chalk.gray(`[${getTimestamp()}]`);
  let currentLine = `${timestamp} ${chalk.blue("[INFO]")} ${message} ${chalk.cyan("|")}`;
  process.stdout.write(currentLine);

  spinnerInterval = setInterval(() => {
    // Clear the current line
    process.stdout.write("\r" + " ".repeat(currentLine.length) + "\r");

    // Update spinner frame and timestamp
    const timestamp = chalk.gray(`[${getTimestamp()}]`);
    currentSpinnerFrame = (currentSpinnerFrame + 1) % spinnerFrames.length;
    const spinnerChar = chalk.cyan(spinnerFrames[currentSpinnerFrame]);
    currentLine = `${timestamp} ${chalk.blue("[INFO]")} ${message} ${spinnerChar}`;
    process.stdout.write(currentLine);
  }, 150); // Update every 150ms

  // Return a function to stop the spinner
  return () => {
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
    }
    // Clear the spinner line and write final message
    process.stdout.write("\r" + " ".repeat(currentLine.length) + "\r");
    const timestamp = chalk.gray(`[${getTimestamp()}]`);
    console.log(timestamp, chalk.blue("[INFO]"), message);
  };
};

export const logger = {
  // Always shown - for essential information, warnings, errors, and UI elements
  menu: (message: string) => {
    writeToLogFile("MENU", message);
    console.log(message);
  }, // Plain output for menu/UI elements
  success: (message: string) => {
    writeToLogFile("SUCCESS", message);
    // If spinner is running, clear it first
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      process.stdout.write("\r" + " ".repeat(150) + "\r");
    }
    const timestamp = chalk.gray(`[${getTimestamp()}]`);
    console.log(timestamp, chalk.green("[SUCCESS]"), message);
  },
  warning: (message: string) => {
    writeToLogFile("WARNING", message);
    // If spinner is running, clear it first
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      process.stdout.write("\r" + " ".repeat(150) + "\r");
    }
    const timestamp = chalk.gray(`[${getTimestamp()}]`);
    console.log(timestamp, chalk.yellow("[WARNING]"), message);
  },
  error: (message: string) => {
    writeToLogFile("ERROR", message);
    // If spinner is running, clear it first
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      process.stdout.write("\r" + " ".repeat(150) + "\r");
    }
    const timestamp = chalk.gray(`[${getTimestamp()}]`);
    console.log(timestamp, chalk.red("[ERROR]"), message);
  },
  info: (message: string) => {
    writeToLogFile("INFO", message);
    // If spinner is running, clear it first
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      process.stdout.write("\r" + " ".repeat(150) + "\r");
    }
    const timestamp = chalk.gray(`[${getTimestamp()}]`);
    console.log(timestamp, chalk.blue("[INFO]"), message);
  }, // Always shown for deployment progress

  // Animated info message with spinner
  infoWithSpinner: (message: string): (() => void) => {
    writeToLogFile("INFO", message + " (spinner)");
    return createSpinner(message);
  },

  // Only shown in debug mode - for detailed debug messages
  debug: (message: string) => {
    writeToLogFile("DEBUG", message);
    if (isDebugModeEnabled) {
      // If spinner is running, clear it first
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
        process.stdout.write("\r" + " ".repeat(150) + "\r");
      }
      const timestamp = chalk.gray(`[${getTimestamp()}]`);
      console.log(timestamp, chalk.magenta("[DEBUG]"), message);
    }
  },
};

export const setDebugMode = (enabled: boolean): void => {
  isDebugModeEnabled = enabled;
  if (enabled) {
    logger.debug("Debug mode has been enabled for the logger.");
  }
};

export const getDebugMode = (): boolean => {
  return isDebugModeEnabled;
};

export const resetDebugMode = (): void => {
  isDebugModeEnabled = false;
};

/**
 * Sets the log file path and opens a write stream
 * All subsequent log calls will be written to this file
 */
export const setLogFile = (filePath: string): void => {
  // Close existing stream if any
  if (logFileStream) {
    logFileStream.end();
  }

  logFilePath = filePath;

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Open write stream
  logFileStream = fs.createWriteStream(filePath, { flags: "a" });

  // Write header
  const separator = "=".repeat(80);
  logFileStream.write(`\n${separator}\n`);
  logFileStream.write(`[${getISOTimestamp()}] Deployment started\n`);
  logFileStream.write(`${separator}\n`);
};

/**
 * Closes the log file stream
 */
export const closeLogFile = (): void => {
  if (logFileStream) {
    const separator = "=".repeat(80);
    logFileStream.write(`${separator}\n`);
    logFileStream.write(`[${getISOTimestamp()}] Deployment completed\n`);
    logFileStream.write(`${separator}\n\n`);
    logFileStream.end();
    logFileStream = null;
  }
  logFilePath = null;
};

/**
 * Gets the current log file path
 */
export const getLogFilePath = (): string | null => {
  return logFilePath;
};
