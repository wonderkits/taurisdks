import { Command } from 'commander';
// 导入已移除，因为当前未使用
import { execa } from 'execa';
import { logger } from '../utils/logger.js';
import { getPackageManager } from '../utils/check-version.js';
import { findProjectRoot, readPackageJson } from '../utils/project.js';

export interface DevOptions {
  port?: number;
  host?: string;
  standalone?: boolean;
  open?: boolean;
  https?: boolean;
}

export const devCommand = new Command('dev')
  .alias('d')
  .description('启动开发服务器')
  .option('-p, --port <port>', '指定端口号', '3001')
  .option('-h, --host <host>', '指定主机地址', 'localhost')
  .option('-s, --standalone', '启动独立开发模式')
  .option('--open', '自动打开浏览器')
  .option('--https', '使用 HTTPS')
  .action(startDevelopmentServer);

// 添加独立的 dev:standalone 命令
export const devStandaloneCommand = new Command('dev:standalone')
  .description('启动独立开发模式')
  .option('-p, --port <port>', '指定端口号', '3001')
  .option('-h, --host <host>', '指定主机地址', 'localhost')
  .option('--open', '自动打开浏览器')
  .option('--https', '使用 HTTPS')
  .action((options: Omit<DevOptions, 'standalone'>) => {
    // 强制设置 standalone 为 true
    return startDevelopmentServer({ ...options, standalone: true });
  });

async function startDevelopmentServer(options: DevOptions): Promise<void> {
  try {
    const projectRoot = await findProjectRoot();
    if (!projectRoot) {
      logger.error('未找到有效的 MagicTeam 应用项目');
      logger.info('请确保在应用项目根目录下运行此命令');
      return;
    }

    const packageJson = await readPackageJson(projectRoot);
    const appName = extractAppName(packageJson.name);

    logger.info(`🚀 启动 ${appName} 开发服务器...`);

    // 检查必要的脚本
    const scripts = packageJson.scripts || {};
    const devScript = options.standalone ? 'dev:standalone' : 'dev';

    if (!scripts[devScript]) {
      logger.error(`package.json 中未找到 "${devScript}" 脚本`);
      return;
    }

    // 构建环境变量
    const env = {
      ...process.env,
      NODE_ENV: 'development',
      PORT: options.port?.toString() || '3001',
      HOST: options.host || 'localhost',
      HTTPS: options.https ? 'true' : 'false',
      OPEN: options.open ? 'true' : 'false'
    };

    // 启动开发服务器
    const packageManager = getPackageManager();
    const args = [devScript];

    logger.info(`使用 ${packageManager} 启动开发服务器...`);
    logger.info(`模式: ${options.standalone ? '独立开发' : '集成开发'}`);
    logger.info(`地址: ${options.https ? 'https' : 'http'}://${options.host || 'localhost'}:${options.port || 3001}`);

    const child = execa(packageManager, ['run', ...args], {
      cwd: projectRoot,
      env,
      stdio: 'inherit'
    });

    // 处理进程退出
    process.on('SIGINT', () => {
      logger.info('正在停止开发服务器...');
      child.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
    });

    await child;

  } catch (error) {
    if (error instanceof Error) {
      logger.error(`开发服务器启动失败: ${error.message}`);
    }
    process.exit(1);
  }
}

function extractAppName(packageName: string): string {
  // 从 @magicteam/app-xxx 提取应用名称
  const match = packageName.match(/^@magicteam\/app-(.+)$/);
  return match?.[1] || packageName;
}