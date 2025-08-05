import { resolve, join, dirname } from 'path';
import { existsSync } from 'fs';
import fs from 'fs-extra';

export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  magicteam?: {
    app?: {
      id?: string;
      category?: string;
      displayName?: string;
      permissions?: Array<{
        id: string;
        name: string;
        description: string;
        required?: boolean;
      }>;
      navigation?: {
        name: string;
        href: string;
        icon?: string;
        order?: number;
        visible?: boolean;
      };
    };
  };
  [key: string]: any;
}

export async function findProjectRoot(startDir: string = process.cwd()): Promise<string | null> {
  let currentDir = resolve(startDir);
  
  while (currentDir !== dirname(currentDir)) {
    const packageJsonPath = join(currentDir, 'package.json');
    
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = await readPackageJson(currentDir);
        
        // 检查是否是 MagicTeam 应用项目
        if (isMagicTeamApp(packageJson)) {
          return currentDir;
        }
      } catch (error) {
        // 忽略解析错误，继续向上查找
      }
    }
    
    currentDir = dirname(currentDir);
  }
  
  return null;
}

export async function readPackageJson(projectRoot: string): Promise<PackageJson> {
  const packageJsonPath = join(projectRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in ${projectRoot}`);
  }
  
  try {
    return await fs.readJSON(packageJsonPath);
  } catch (error) {
    throw new Error(`Failed to parse package.json: ${error}`);
  }
}

export async function writePackageJson(projectRoot: string, packageJson: PackageJson): Promise<void> {
  const packageJsonPath = join(projectRoot, 'package.json');
  await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
}

export function isMagicTeamApp(packageJson: PackageJson): boolean {
  // 检查包名是否符合 MagicTeam 应用规范
  if (packageJson.name?.startsWith('@magicteam/app-')) {
    return true;
  }
  
  // 检查是否有 magicteam 配置
  if (packageJson.magicteam?.app) {
    return true;
  }
  
  // 检查是否有应用配置文件
  return false;
}

export function isMagicTeamCore(packageJson: PackageJson): boolean {
  return packageJson.name === 'magicteam' || packageJson.name === '@magicteam/core';
}

export async function hasAppConfig(projectRoot: string): Promise<boolean> {
  const appConfigPaths = [
    join(projectRoot, 'src', 'app.config.ts'),
    join(projectRoot, 'src', 'app.config.js'),
    join(projectRoot, 'app.config.ts'),
    join(projectRoot, 'app.config.js')
  ];
  
  for (const path of appConfigPaths) {
    if (existsSync(path)) {
      return true;
    }
  }
  
  return false;
}

export async function findAppConfigPath(projectRoot: string): Promise<string | null> {
  const appConfigPaths = [
    join(projectRoot, 'src', 'app.config.ts'),
    join(projectRoot, 'src', 'app.config.js'),
    join(projectRoot, 'app.config.ts'),
    join(projectRoot, 'app.config.js')
  ];
  
  for (const path of appConfigPaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  return null;
}

export async function getAppDependencies(projectRoot: string): Promise<{
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}> {
  const packageJson = await readPackageJson(projectRoot);
  
  return {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    peerDependencies: packageJson.peerDependencies || {}
  };
}

export async function updateAppVersion(projectRoot: string, newVersion: string): Promise<void> {
  const packageJson = await readPackageJson(projectRoot);
  packageJson.version = newVersion;
  await writePackageJson(projectRoot, packageJson);
}

export async function getAppInfo(projectRoot: string): Promise<{
  id: string;
  name: string;
  version: string;
  description?: string | undefined;
  author?: string | undefined;
  category?: string | undefined;
}> {
  const packageJson = await readPackageJson(projectRoot);
  
  const id = packageJson.magicteam?.app?.id || extractAppNameFromPackage(packageJson.name);
  
  return {
    id,
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description || undefined,
    author: typeof packageJson.author === 'string' ? packageJson.author : (packageJson.author as any)?.name || undefined,
    category: packageJson.magicteam?.app?.category || undefined
  };
}

function extractAppNameFromPackage(packageName: string): string {
  const match = packageName.match(/^@magicteam\/app-(.+)$/);
  return match?.[1] || packageName;
}

export async function validateProjectStructure(projectRoot: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检查必需文件
  const requiredFiles = ['package.json', 'src/index.tsx'];
  const recommendedFiles = ['src/app.config.ts', 'README.md', 'vite.config.ts'];
  
  for (const file of requiredFiles) {
    if (!existsSync(join(projectRoot, file))) {
      errors.push(`缺少必需文件: ${file}`);
    }
  }
  
  for (const file of recommendedFiles) {
    if (!existsSync(join(projectRoot, file))) {
      warnings.push(`建议添加文件: ${file}`);
    }
  }
  
  // 检查 package.json 配置
  try {
    const packageJson = await readPackageJson(projectRoot);
    
    if (!isMagicTeamApp(packageJson)) {
      errors.push('package.json 中缺少 MagicTeam 应用配置');
    }
    
    if (!packageJson.scripts?.dev) {
      warnings.push('建议添加 dev 脚本');
    }
    
    if (!packageJson.scripts?.build) {
      warnings.push('建议添加 build 脚本');
    }
    
  } catch (error) {
    errors.push(`package.json 解析失败: ${error}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}