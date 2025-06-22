import chalk from 'chalk';

let isDebugModeEnabled = false;

export const logger = {
  // Always shown - for essential information, warnings, errors, and UI elements
  menu: (message: string) => console.log(message), // Plain output for menu/UI elements
  success: (message: string) => console.log(chalk.green('[SUCCESS]'), message),
  warning: (message: string) => console.log(chalk.yellow('[WARNING]'), message),
  error: (message: string) => console.log(chalk.red('[ERROR]'), message),
  
  // Only shown in debug mode - for detailed info and debug messages
  info: (message: string) => {
    if (isDebugModeEnabled) {
      console.log(chalk.blue('[INFO]'), message);
    }
  },
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
