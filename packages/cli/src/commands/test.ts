import { Command } from 'commander';
import { execa } from 'execa';
import { logger } from '../utils/logger.js';
import { getPackageManager } from '../utils/check-version.js';
import { findProjectRoot, readPackageJson } from '../utils/project.js';

export interface TestOptions {
  watch?: boolean;
  coverage?: boolean;
  pattern?: string;
  verbose?: boolean;
  silent?: boolean;
}

export const testCommand = new Command('test')
  .alias('t')
  .description('运行测试')
  .option('-w, --watch', '监听模式')
  .option('-c, --coverage', '生成覆盖率报告')
  .option('-p, --pattern <pattern>', '测试文件匹配模式')
  .option('-v, --verbose', '详细输出')
  .option('-s, --silent', '静默模式')
  .action(runTests);

async function runTests(options: TestOptions): Promise<void> {
  try {
    const projectRoot = await findProjectRoot();
    if (!projectRoot) {
      logger.error('未找到有效的 MagicTeam 应用项目');
      return;
    }

    const packageJson = await readPackageJson(projectRoot);
    const scripts = packageJson.scripts || {};

    // 检查测试脚本
    const testScript = options.coverage ? 'test:coverage' : 'test';
    
    if (!scripts[testScript] && !scripts.test) {
      logger.error('package.json 中未找到测试脚本');
      logger.info('请添加以下脚本到 package.json:');
      logger.info('  "test": "vitest"');
      logger.info('  "test:coverage": "vitest --coverage"');
      return;
    }

    const scriptToRun = scripts[testScript] ? testScript : 'test';
    
    logger.info('🧪 运行测试...');

    // 构建测试参数
    const testArgs: string[] = [];
    
    if (options.watch && !scripts[testScript]) {
      testArgs.push('--watch');
    }
    
    if (options.coverage && !scripts[testScript]) {
      testArgs.push('--coverage');
    }
    
    if (options.pattern) {
      testArgs.push('--pattern', options.pattern);
    }
    
    if (options.verbose) {
      testArgs.push('--verbose');
    }
    
    if (options.silent) {
      testArgs.push('--silent');
    }

    // 执行测试
    const packageManager = getPackageManager();
    const args = ['run', scriptToRun, ...testArgs];

    logger.info(`使用 ${packageManager} 运行测试...`);
    
    if (options.watch) {
      logger.info('监听模式已启用，按 Ctrl+C 退出');
    }

    const child = execa(packageManager, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    // 处理进程信号
    process.on('SIGINT', () => {
      logger.info('正在停止测试...');
      child.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
    });

    const result = await child;
    
    if (result.exitCode === 0) {
      logger.success('✅ 所有测试通过');
    } else {
      logger.error('❌ 测试失败');
      process.exit(1);
    }

  } catch (error) {
    if (error instanceof Error) {
      logger.error(`测试执行失败: ${error.message}`);
    }
    process.exit(1);
  }
}