import chalk from "chalk";

// Ensure debug mode starts as false
let isDebugModeEnabled = false;

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
  menu: (message: string) => console.log(message), // Plain output for menu/UI elements
  success: (message: string) => {
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
    return createSpinner(message);
  },

  // Only shown in debug mode - for detailed debug messages
  debug: (message: string) => {
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
