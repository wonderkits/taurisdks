import chalk from 'chalk';
import ora, { Ora } from 'ora';

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  success(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  spinner(text: string): Ora;
}

class CLILogger implements Logger {
  private isDebugMode = process.env.DEBUG === 'true' || process.argv.includes('--debug');

  info(message: string, ...args: unknown[]): void {
    console.log(chalk.blue('ℹ'), message, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    console.log(chalk.green('✓'), message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.log(chalk.yellow('⚠'), message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(chalk.red('✗'), message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isDebugMode) {
      console.log(chalk.gray('🐛'), message, ...args);
    }
  }

  spinner(text: string): Ora {
    return ora({
      text,
      color: 'blue',
      spinner: 'dots'
    });
  }
}

export const logger = new CLILogger();