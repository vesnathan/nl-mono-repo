import chalk from "chalk";

export class Logger {
  info(message: string): void {
    console.log(chalk.blue("ℹ"), message);
  }

  success(message: string): void {
    console.log(chalk.green("✓"), message);
  }

  warning(message: string): void {
    console.log(chalk.yellow("⚠"), message);
  }

  error(message: string): void {
    console.log(chalk.red("✗"), message);
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray("🔍"), message);
    }
  }
}

export const logger = new Logger();
