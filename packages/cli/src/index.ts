#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { devCommand, devStandaloneCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';
import { publishCommand } from './commands/publish.js';
import { testCommand } from './commands/test.js';
import { packageCommand } from './commands/package.js';
import { checkNodeVersion } from './utils/check-version.js';
import { logger } from './utils/logger.js';

const program = new Command();

// 检查 Node.js 版本
checkNodeVersion();

program
  .name('magicteam')
  .description('CLI tool for creating and managing MagicTeam applications')
  .version('1.0.0', '-v, --version', '显示版本号')
  .helpOption('-h, --help', '显示帮助信息');

// 注册命令
program.addCommand(createCommand);
program.addCommand(devCommand);
program.addCommand(devStandaloneCommand);
program.addCommand(buildCommand);
program.addCommand(publishCommand);
program.addCommand(testCommand);
program.addCommand(packageCommand);

// 错误处理
program.exitOverride();

// 添加全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// 解析命令行参数
try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  }
  process.exit(1);
}