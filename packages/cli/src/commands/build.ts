import { Command } from 'commander';
import { join } from 'path';
import { existsSync } from 'fs';
import fs from 'fs-extra';
import { execa } from 'execa';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { getPackageManager } from '../utils/check-version.js';
import { findProjectRoot, readPackageJson } from '../utils/project.js';

export interface BuildOptions {
  mode?: 'development' | 'production';
  analyze?: boolean;
  clean?: boolean;
  sourcemap?: boolean;
}

export const buildCommand = new Command('build')
  .alias('b')
  .description('构建应用')
  .option('-m, --mode <mode>', '构建模式', 'production')
  .option('--analyze', '分析打包结果')
  .option('--clean', '构建前清理输出目录')
  .option('--sourcemap', '生成 source map')
  .action(buildApplication);

async function buildApplication(options: BuildOptions): Promise<void> {
  try {
    const projectRoot = await findProjectRoot();
    if (!projectRoot) {
      logger.error('未找到有效的 MagicTeam 应用项目');
      return;
    }

    const packageJson = await readPackageJson(projectRoot);
    const appName = extractAppName(packageJson.name);

    logger.info(`🔨 构建 ${appName} 应用...`);

    // 清理输出目录
    if (options.clean) {
      await cleanOutputDirectory(projectRoot);
    }

    // 检查构建脚本
    const scripts = packageJson.scripts || {};
    const buildScript = options.mode === 'development' ? 'build:dev' : 'build';

    if (!scripts[buildScript]) {
      logger.error(`package.json 中未找到 "${buildScript}" 脚本`);
      return;
    }

    // 构建环境变量
    const env = {
      ...process.env,
      NODE_ENV: options.mode || 'production',
      ANALYZE: options.analyze ? 'true' : 'false',
      SOURCEMAP: options.sourcemap ? 'true' : 'false'
    };

    // 执行构建
    const packageManager = getPackageManager();
    
    logger.info(`使用 ${packageManager} 执行构建...`);
    logger.info(`构建模式: ${options.mode || 'production'}`);

    const spinner = logger.spinner('正在构建应用...');
    spinner.start();

    await execa(packageManager, ['run', buildScript], {
      cwd: projectRoot,
      env,
      stdio: 'pipe'
    });

    spinner.succeed('应用构建完成');

    // 生成应用清单
    await generateManifest(projectRoot, packageJson);

    // 计算文件完整性
    await calculateIntegrity(projectRoot);

    // 显示构建结果
    await showBuildResults(projectRoot);

    logger.success('🎉 构建完成！');

  } catch (error) {
    if (error instanceof Error) {
      logger.error(`构建失败: ${error.message}`);
    }
    process.exit(1);
  }
}

async function cleanOutputDirectory(projectRoot: string): Promise<void> {
  const spinner = logger.spinner('正在清理输出目录...');
  
  try {
    spinner.start();
    
    const distDir = join(projectRoot, 'dist');
    if (existsSync(distDir)) {
      await fs.remove(distDir);
    }
    
    spinner.succeed('输出目录清理完成');
  } catch (error) {
    spinner.fail('输出目录清理失败');
    throw error;
  }
}

async function generateManifest(projectRoot: string, packageJson: any): Promise<void> {
  const spinner = logger.spinner('正在生成应用清单...');
  
  try {
    spinner.start();
    
    const distDir = join(projectRoot, 'dist');
    const manifestPath = join(distDir, 'manifest.json');
    
    // 读取应用配置
    const appConfigPath = join(projectRoot, 'src', 'app.config.ts');
    let appConfig = {};
    
    if (existsSync(appConfigPath)) {
      // 这里应该动态导入应用配置，但为了简化，我们从 package.json 构建
      appConfig = extractAppConfigFromPackage(packageJson);
    }

    const manifest = {
      id: extractAppName(packageJson.name),
      name: extractAppName(packageJson.name),
      displayName: packageJson.magicteam?.app?.displayName || extractAppName(packageJson.name),
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      homepage: packageJson.homepage,
      repository: packageJson.repository,
      keywords: packageJson.keywords || [],
      category: packageJson.magicteam?.app?.category || 'utility',
      bundle: {
        main: './bundle.js',
        style: './style.css',
        assets: './assets/'
      },
      dependencies: packageJson.peerDependencies || {},
      permissions: packageJson.magicteam?.app?.permissions || [],
      navigation: packageJson.magicteam?.app?.navigation || {},
      lifecycle: {
        supportHotReload: true,
        gracefulShutdown: true
      },
      ...appConfig
    };

    await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
    
    spinner.succeed('应用清单生成完成');
  } catch (error) {
    spinner.fail('应用清单生成失败');
    throw error;
  }
}

async function calculateIntegrity(projectRoot: string): Promise<void> {
  const spinner = logger.spinner('正在计算文件完整性...');
  
  try {
    spinner.start();
    
    const distDir = join(projectRoot, 'dist');
    const bundlePath = join(distDir, 'bundle.js');
    const manifestPath = join(distDir, 'manifest.json');
    
    if (existsSync(bundlePath)) {
      const bundleContent = await fs.readFile(bundlePath);
      const hash = crypto.createHash('sha256').update(bundleContent).digest('hex');
      const integrity = `sha256-${Buffer.from(hash, 'hex').toString('base64')}`;
      
      // 更新清单文件
      const manifest = await fs.readJSON(manifestPath);
      manifest.integrity = integrity;
      await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
    }
    
    spinner.succeed('文件完整性计算完成');
  } catch (error) {
    spinner.fail('文件完整性计算失败');
    throw error;
  }
}

async function showBuildResults(projectRoot: string): Promise<void> {
  const distDir = join(projectRoot, 'dist');
  
  if (!existsSync(distDir)) {
    return;
  }

  const files = await fs.readdir(distDir);
  const stats: Array<{ name: string; size: string }> = [];

  for (const file of files) {
    const filePath = join(distDir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isFile()) {
      stats.push({
        name: file,
        size: formatBytes(stat.size)
      });
    }
  }

  if (stats.length > 0) {
    logger.info('');
    logger.info('📦 构建产物:');
    stats.forEach(({ name, size }) => {
      logger.info(`  ${name}: ${size}`);
    });
  }
}

function extractAppName(packageName: string): string {
  const match = packageName.match(/^@magicteam\/app-(.+)$/);
  return match?.[1] || packageName;
}

function extractAppConfigFromPackage(packageJson: any): any {
  return packageJson.magicteam?.app || {};
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}