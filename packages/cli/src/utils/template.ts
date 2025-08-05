import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { logger } from './logger.js';

// 获取模板目录的可靠路径解析
function getTemplatesDir(): string {
  // 方法1: 尝试从 __dirname 解析（TypeScript 编译后）
  try {
    const templatesDir = resolve(__dirname, '../../templates');
    if (fs.existsSync(templatesDir)) {
      return templatesDir;
    }
  } catch {
    // __dirname 可能不可用
  }

  // 方法2: 从当前文件位置解析
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const templatesDir = resolve(__dirname, '../../templates');
    if (fs.existsSync(templatesDir)) {
      return templatesDir;
    }
  } catch {
    // ES 模块可能不支持 import.meta.url
  }

  // 方法3: 从 node_modules 解析（npm link 情况）
  try {
    const packageDir = resolve(__dirname, '..');
    let currentDir = packageDir;
    
    // 向上查找直到找到 templates 目录或到达根目录
    while (currentDir !== dirname(currentDir)) {
      const templatesDir = join(currentDir, 'templates');
      if (fs.existsSync(templatesDir)) {
        return templatesDir;
      }
      currentDir = dirname(currentDir);
    }
  } catch {
    // 查找失败
  }

  // 方法4: 使用 require.resolve 查找包根目录
  try {
    const packageJsonPath = require.resolve('@magicteam/cli/package.json');
    const packageDir = dirname(packageJsonPath);
    const templatesDir = join(packageDir, 'templates');
    if (fs.existsSync(templatesDir)) {
      return templatesDir;
    }
  } catch {
    // require.resolve 失败
  }

  // 如果都失败了，抛出错误
  throw new Error('无法找到模板目录，请确保 CLI 已正确安装');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AppInfo {
  name: string;
  author: string;
  description: string;
  category: string;
}

export interface CreateAppFromTemplateOptions {
  templateName: string;
  targetDir: string;
  appInfo: AppInfo;
}

export async function createAppFromTemplate(options: CreateAppFromTemplateOptions): Promise<void> {
  const { templateName, targetDir, appInfo } = options;
  
  // 获取模板路径 - 使用更可靠的路径解析
  const templatesDir = getTemplatesDir();
  const templateDir = join(templatesDir, templateName);
  
  // 检查模板是否存在
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`模板 "${templateName}" 不存在`);
  }

  logger.debug(`使用模板: ${templateDir}`);
  logger.debug(`目标目录: ${targetDir}`);

  // 复制模板文件
  await copyTemplateFiles(templateDir, targetDir);
  
  // 替换模板变量
  await replaceTemplateVariables(targetDir, appInfo);
  
  // 创建本地 core 包
  await setupLocalCorePackage(targetDir);
  
  logger.debug('模板创建完成');
}

async function copyTemplateFiles(templateDir: string, targetDir: string): Promise<void> {
  const spinner = logger.spinner('正在复制模板文件...');
  
  try {
    spinner.start();
    
    // 手动复制文件，处理文件名中的模板变量
    await copyTemplateFilesRecursively(templateDir, targetDir);
    
    spinner.succeed('模板文件复制完成');
  } catch (error) {
    spinner.fail('模板文件复制失败');
    throw error;
  }
}


async function copyTemplateFilesRecursively(sourceDir: string, targetDir: string): Promise<void> {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  
  await fs.ensureDir(targetDir);
  
  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    let targetPath = join(targetDir, entry.name);
    
    if (entry.isDirectory()) {
      await copyTemplateFilesRecursively(sourcePath, targetPath);
    } else if (entry.isFile()) {
      // 跳过 .template 文件的直接复制
      if (entry.name.endsWith('.template')) {
        // 处理 .template 文件
        targetPath = join(targetDir, entry.name.replace('.template', ''));
      }
      
      await fs.copy(sourcePath, targetPath);
    }
  }
}

async function replaceTemplateVariables(targetDir: string, appInfo: AppInfo): Promise<void> {
  const spinner = logger.spinner('正在处理模板变量...');
  
  try {
    spinner.start();
    
    const variables = {
      '{{APP_NAME}}': appInfo.name,
      '{{APP_CAMEL_NAME}}': toCamelCase(appInfo.name),
      '{{APP_PASCAL_NAME}}': toPascalCase(appInfo.name),
      '{{APP_DISPLAY_NAME}}': toDisplayName(appInfo.name),
      '{{APP_DESCRIPTION}}': appInfo.description,
      '{{APP_AUTHOR}}': appInfo.author,
      '{{APP_CATEGORY}}': appInfo.category,
      '{{PACKAGE_NAME}}': `@magicteam/app-${appInfo.name}`,
      '{{APP_ID}}': appInfo.name,
      '{{YEAR}}': new Date().getFullYear().toString(),
      '{{DATE}}': new Date().toISOString().split('T')[0] || ''
    };

    // 替换文件内容中的变量
    await replaceInFiles(targetDir, variables);
    
    // 重命名包含模板变量的文件和目录
    await renameTemplateFiles(targetDir, variables);
    
    spinner.succeed('模板变量处理完成');
  } catch (error) {
    spinner.fail('模板变量处理失败');
    throw error;
  }
}

async function replaceInFiles(dir: string, variables: Record<string, string>): Promise<void> {
  const files = await getTextFiles(dir);
  
  for (const filePath of files) {
    let content = await fs.readFile(filePath, 'utf8');
    
    // 替换所有变量
    for (const [placeholder, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }
    
    await fs.writeFile(filePath, content);
  }
}

async function getTextFiles(dir: string): Promise<string[]> {
  const textFiles: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // 跳过 node_modules 等目录
      if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        const subFiles = await getTextFiles(fullPath);
        textFiles.push(...subFiles);
      }
    } else if (entry.isFile()) {
      // 只处理文本文件
      if (isTextFile(entry.name)) {
        textFiles.push(fullPath);
      }
    }
  }
  
  return textFiles;
}

function isTextFile(filename: string): boolean {
  const textExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.yml', '.yaml',
    '.toml', '.xml', '.html', '.css', '.scss', '.sass', '.less',
    '.gitignore', '.gitattributes', '.eslintrc', '.prettierrc'
  ];
  
  return textExtensions.some(ext => filename.endsWith(ext)) || 
         !filename.includes('.');
}

function toDisplayName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toCamelCase(name: string): string {
  return name
    .split('-')
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

async function renameTemplateFiles(dir: string, variables: Record<string, string>): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // 递归处理子目录
      await renameTemplateFiles(fullPath, variables);
      
      // 检查目录名是否需要重命名
      let newName = entry.name;
      for (const [placeholder, value] of Object.entries(variables)) {
        newName = newName.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
      
      if (newName !== entry.name) {
        const newPath = join(dir, newName);
        await fs.move(fullPath, newPath);
      }
    } else if (entry.isFile()) {
      // 检查文件名是否需要重命名
      let newName = entry.name;
      for (const [placeholder, value] of Object.entries(variables)) {
        newName = newName.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
      
      if (newName !== entry.name) {
        const newPath = join(dir, newName);
        await fs.move(fullPath, newPath);
      }
    }
  }
}

async function setupLocalCorePackage(targetDir: string): Promise<void> {
  const spinner = logger.spinner('正在设置核心包...');
  
  try {
    spinner.start();
    
    // 查找项目根目录中的 core 包
    const projectRoot = resolve(__dirname, '../../..');
    const corePackagePath = join(projectRoot, 'packages', 'core');
    
    // 检查核心包是否存在
    if (await fs.pathExists(corePackagePath)) {
      // 在应用目录下创建 packages/core 目录
      const appCoreDir = join(targetDir, 'packages', 'core');
      await fs.ensureDir(appCoreDir);
      
      // 复制核心包文件
      await fs.copy(corePackagePath, appCoreDir);
      
      spinner.succeed('核心包设置完成');
    } else {
      // 如果找不到核心包，创建一个简化版本
      spinner.text = '创建简化核心包...';
      await createMiniCorePackage(targetDir);
      spinner.succeed('简化核心包创建完成');
    }
  } catch (error) {
    spinner.fail('核心包设置失败');
    logger.warn('将创建简化核心包作为备选方案...');
    try {
      await createMiniCorePackage(targetDir);
      logger.info('简化核心包创建完成');
    } catch (fallbackError) {
      logger.error('创建简化核心包也失败了:', fallbackError);
    }
  }
}

async function createMiniCorePackage(targetDir: string): Promise<void> {
  const coreDir = join(targetDir, 'packages', 'core');
  await fs.ensureDir(coreDir);
  
  // 创建基本的 package.json
  const packageJson = {
    "name": "@magicteam/core",
    "version": "2.0.0",
    "description": "MagicTeam Core Library (Local)",
    "main": "src/index.ts",
    "types": "src/index.ts",
    "type": "module"
  };
  await fs.writeJSON(join(coreDir, 'package.json'), packageJson, { spaces: 2 });
  
  // 创建源码目录和基本文件
  const srcDir = join(coreDir, 'src');
  await fs.ensureDir(join(srcDir, 'types'));
  await fs.ensureDir(join(srcDir, 'providers'));
  
  // 复制类型定义（从我们刚创建的核心包）
  const corePackageSource = resolve(__dirname, '../../..');
  const localCoreSource = join(corePackageSource, 'packages', 'core', 'src');
  
  if (await fs.pathExists(localCoreSource)) {
    await fs.copy(localCoreSource, srcDir);
  } else {
    // 如果本地核心包不存在，创建基本的类型文件
    await createBasicTypes(srcDir);
    await createBasicProviders(srcDir);
    await fs.writeFile(join(srcDir, 'index.ts'), 
      'export * from "./types/index.js";\nexport * from "./providers/index.js";'
    );
  }
}

async function createBasicTypes(srcDir: string): Promise<void> {
  const typesDir = join(srcDir, 'types');
  
  // 创建基本类型文件
  const appTypes = `import * as React from 'react';

export interface AppConfig {
  manifest: {
    id: string;
    name: string;
    displayName: string;
    version: string;
    description: string;
    author: string;
    category: string;
  };
  navigation?: {
    name: string;
    href: string;
    icon: React.ComponentType;
    order?: number;
    visible?: boolean;
  };
  routes: any[];
  hooks?: {
    onInstall?: () => Promise<void> | void;
    onActivate?: () => Promise<void> | void;
    onDeactivate?: () => Promise<void> | void;
    onUninstall?: () => Promise<void> | void;
  };
  entry: () => Promise<React.ComponentType>;
}`;

  await fs.writeFile(join(typesDir, 'app.ts'), appTypes);
  await fs.writeFile(join(typesDir, 'index.ts'), 'export * from "./app.js";');
}

async function createBasicProviders(srcDir: string): Promise<void> {
  const providersDir = join(srcDir, 'providers');
  
  // 创建基本 Provider
  const standaloneProvider = `import React from 'react';

export interface StandaloneMockConfig {
  fs?: any;
  store?: any;
}

interface Props {
  appConfig: any;
  mockConfig?: StandaloneMockConfig;
  children: React.ReactNode;
}

export const StandaloneAppProvider: React.FC<Props> = ({ children, mockConfig }) => {
  React.useEffect(() => {
    if (mockConfig) {
      console.log('🔧 MagicTeam 独立开发模式已激活');
      (window as any).__MAGICTEAM_DEV_MODE__ = true;
    }
  }, [mockConfig]);

  return <div style={{ height: '100vh', width: '100%' }}>{children}</div>;
};`;

  await fs.writeFile(join(providersDir, 'StandaloneAppProvider.tsx'), standaloneProvider);
  await fs.writeFile(join(providersDir, 'index.ts'), 'export * from "./StandaloneAppProvider.js";');
}

export async function getAvailableTemplates(): Promise<string[]> {
  try {
    const templatesDir = getTemplatesDir();
    
    if (!await fs.pathExists(templatesDir)) {
      return [];
    }
    
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error) {
    logger.error('获取可用模板失败:', error);
    return [];
  }
}