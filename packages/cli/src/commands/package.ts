import { Command } from 'commander';
import { join, basename } from 'path';
import { existsSync } from 'fs';
import fs from 'fs-extra';
import { execa } from 'execa';
import archiver from 'archiver';
import { logger } from '../utils/logger.js';
import { findProjectRoot, readPackageJson, getAppInfo } from '../utils/project.js';

export interface PackageOptions {
  output?: string;
  format?: 'zip' | 'tar';
  exclude?: string[];
  includeSource?: boolean;
}

export const packageCommand = new Command('package')
  .description('打包应用为分发包')
  .option('-o, --output <output>', '输出文件路径')
  .option('-f, --format <format>', '打包格式 (zip|tar)', 'zip')
  .option('-e, --exclude <patterns...>', '排除的文件模式')
  .option('--include-source', '包含源代码')
  .action(packageApplication);

async function packageApplication(options: PackageOptions): Promise<void> {
  try {
    const projectRoot = await findProjectRoot();
    if (!projectRoot) {
      logger.error('未找到有效的 MagicTeam 应用项目');
      return;
    }

    const appInfo = await getAppInfo(projectRoot);

    logger.info(`📦 正在打包 ${appInfo.id} v${appInfo.version}...`);

    // 确保已构建
    await ensureBuilt(projectRoot);

    // 创建临时打包目录
    const tempDir = await createTempPackageDir(projectRoot);

    try {
      // 复制文件到临时目录
      await copyFilesToPackage(projectRoot, tempDir, options);

      // 创建分发包
      const outputPath = await createDistributionPackage(tempDir, appInfo, options);

      logger.success(`🎉 分发包创建完成: ${outputPath}`);

    } finally {
      // 清理临时目录
      await fs.remove(tempDir);
    }

  } catch (error) {
    if (error instanceof Error) {
      logger.error(`打包失败: ${error.message}`);
    }
    process.exit(1);
  }
}

async function ensureBuilt(projectRoot: string): Promise<void> {
  const distDir = join(projectRoot, 'dist');
  const bundlePath = join(distDir, 'bundle.js');
  const manifestPath = join(distDir, 'manifest.json');

  if (!existsSync(bundlePath) || !existsSync(manifestPath)) {
    logger.info('检测到构建产物缺失，正在构建...');
    
    try {
      await execa('npm', ['run', 'build'], {
        cwd: projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error('构建失败，无法创建分发包');
    }
  }
}

async function createTempPackageDir(
  projectRoot: string
): Promise<string> {
  const tempDir = join(projectRoot, '.magicteam-package-temp');
  
  // 确保临时目录不存在
  if (existsSync(tempDir)) {
    await fs.remove(tempDir);
  }
  
  await fs.ensureDir(tempDir);
  
  return tempDir;
}

async function copyFilesToPackage(
  projectRoot: string,
  tempDir: string,
  options: PackageOptions
): Promise<void> {
  const spinner = logger.spinner('正在复制文件...');
  
  try {
    spinner.start();

    // 必需的文件和目录
    const requiredPaths = [
      'dist/',
      'package.json',
      'README.md'
    ];

    // 可选的文件
    const optionalPaths = [
      'CHANGELOG.md',
      'LICENSE',
      'public/'
    ];

    // 源代码文件（如果包含源代码）
    const sourcePaths = [
      'src/',
      'vite.config.ts',
      'tsconfig.json'
    ];

    const pathsToCopy = [
      ...requiredPaths,
      ...optionalPaths.filter(path => existsSync(join(projectRoot, path)))
    ];

    if (options.includeSource) {
      pathsToCopy.push(
        ...sourcePaths.filter(path => existsSync(join(projectRoot, path)))
      );
    }

    // 复制文件
    for (const path of pathsToCopy) {
      const srcPath = join(projectRoot, path);
      const destPath = join(tempDir, path);
      
      if (await shouldExclude(path, options.exclude)) {
        continue;
      }

      if (existsSync(srcPath)) {
        await fs.copy(srcPath, destPath, {
          filter: (src) => !shouldExcludeFile(src, options.exclude || [])
        });
      }
    }

    // 创建包信息文件
    await createPackageInfo(tempDir, projectRoot);

    spinner.succeed('文件复制完成');
  } catch (error) {
    spinner.fail('文件复制失败');
    throw error;
  }
}

async function createPackageInfo(tempDir: string, projectRoot: string): Promise<void> {
  const packageJson = await readPackageJson(projectRoot);
  const appInfo = await getAppInfo(projectRoot);
  
  const packageInfo = {
    ...appInfo,
    packagedAt: new Date().toISOString(),
    packageVersion: '1.0.0',
    files: await getFileList(tempDir),
    dependencies: packageJson.peerDependencies || {},
    magicteam: {
      type: 'app-package',
      version: '1.0.0'
    }
  };

  await fs.writeJSON(join(tempDir, 'package-info.json'), packageInfo, { spaces: 2 });
}

async function getFileList(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string, relativePath = ''): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relPath = join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else {
        files.push(relPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function createDistributionPackage(
  tempDir: string,
  appInfo: { id: string; version: string },
  options: PackageOptions
): Promise<string> {
  const spinner = logger.spinner('正在创建分发包...');
  
  try {
    spinner.start();

    const outputFileName = options.output || 
      `${appInfo.id}-${appInfo.version}.${options.format}`;
    
    const outputPath = join(process.cwd(), outputFileName);

    if (options.format === 'zip') {
      await createZipPackage(tempDir, outputPath);
    } else {
      await createTarPackage(tempDir, outputPath);
    }

    spinner.succeed('分发包创建完成');
    return outputPath;
  } catch (error) {
    spinner.fail('分发包创建失败');
    throw error;
  }
}

async function createZipPackage(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function createTarPackage(sourceDir: string, outputPath: string): Promise<void> {
  try {
    await execa('tar', ['-czf', outputPath, '-C', sourceDir, '.'], {
      stdio: 'pipe'
    });
  } catch (error) {
    throw new Error('tar 命令执行失败，请确保系统已安装 tar');
  }
}

async function shouldExclude(path: string, excludePatterns?: string[]): Promise<boolean> {
  if (!excludePatterns || excludePatterns.length === 0) {
    return false;
  }

  return excludePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(path);
  });
}

function shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
  const fileName = basename(filePath);
  
  // 默认排除的文件
  const defaultExcludes = [
    '.DS_Store',
    'Thumbs.db',
    '.env',
    '.env.local',
    '*.log',
    'node_modules'
  ];

  const allExcludes = [...defaultExcludes, ...excludePatterns];

  return allExcludes.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(fileName) || regex.test(filePath);
  });
}

// 添加到 package.json 中，以便可以通过 npm 安装 archiver
// 在实际使用中，需要确保 archiver 已安装