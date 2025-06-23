import chalk from 'chalk';

// Ensure debug mode starts as false
let isDebugModeEnabled = false;

export const logger = {
  // Always shown - for essential information, warnings, errors, and UI elements
  menu: (message: string) => console.log(message), // Plain output for menu/UI elements
  success: (message: string) => console.log(chalk.green('[SUCCESS]'), message),
  warning: (message: string) => console.log(chalk.yellow('[WARNING]'), message),
  error: (message: string) => console.log(chalk.red('[ERROR]'), message),
  info: (message: string) => console.log(chalk.blue('[INFO]'), message), // Always shown for deployment progress
  
  // Only shown in debug mode - for detailed debug messages
  debug: (message: string) => {
    if (isDebugModeEnabled) {
      console.log(chalk.magenta('[DEBUG]'), message);
    }
  }
};

export const setDebugMode = (enabled: boolean): void => {
  isDebugModeEnabled = enabled;
  if (enabled) {
    logger.debug('Debug mode has been enabled for the logger.');
  }
};

export const getDebugMode = (): boolean => {
  return isDebugModeEnabled;
};

export const resetDebugMode = (): void => {
  isDebugModeEnabled = false;
};
