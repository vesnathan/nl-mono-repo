import chalk from "chalk";

// Ensure debug mode starts as false
let isDebugModeEnabled = false;

// Spinner animation frames - classic cursor style
const spinnerFrames = ["|", "/", "-", "\\"];
let currentSpinnerFrame = 0;
let spinnerInterval: NodeJS.Timeout | null = null;

const createSpinner = (message: string): (() => void) => {
  let currentLine = `${chalk.blue("[INFO]")} ${message} ${chalk.cyan("|")}`;
  process.stdout.write(currentLine);

  spinnerInterval = setInterval(() => {
    // Clear the current line
    process.stdout.write("\r" + " ".repeat(currentLine.length) + "\r");

    // Update spinner frame
    currentSpinnerFrame = (currentSpinnerFrame + 1) % spinnerFrames.length;
    const spinnerChar = chalk.cyan(spinnerFrames[currentSpinnerFrame]);
    currentLine = `${chalk.blue("[INFO]")} ${message} ${spinnerChar}`;
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
    console.log(chalk.blue("[INFO]"), message);
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
    console.log(chalk.green("[SUCCESS]"), message);
  },
  warning: (message: string) => {
    // If spinner is running, clear it first
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      process.stdout.write("\r" + " ".repeat(150) + "\r");
    }
    console.log(chalk.yellow("[WARNING]"), message);
  },
  error: (message: string) => {
    // If spinner is running, clear it first
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      process.stdout.write("\r" + " ".repeat(150) + "\r");
    }
    console.log(chalk.red("[ERROR]"), message);
  },
  info: (message: string) => {
    // If spinner is running, clear it first
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      process.stdout.write("\r" + " ".repeat(150) + "\r");
    }
    console.log(chalk.blue("[INFO]"), message);
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
      console.log(chalk.magenta("[DEBUG]"), message);
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
