import chalk from 'chalk';

let isDebugModeEnabled = false;

export const logger = {
  info: (message: string) => console.log(chalk.blue('[INFO]'), message),
  success: (message: string) => console.log(chalk.green('[SUCCESS]'), message),
  warning: (message: string) => console.log(chalk.yellow('[WARNING]'), message),
  error: (message: string) => console.log(chalk.red('[ERROR]'), message),
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
