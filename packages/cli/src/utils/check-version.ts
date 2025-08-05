import { execSync } from 'child_process';
import semver from 'semver';
import { logger } from './logger.js';

const REQUIRED_NODE_VERSION = '18.0.0';

export function checkNodeVersion(): void {
  const currentVersion = process.version;
  
  if (!semver.gte(currentVersion, REQUIRED_NODE_VERSION)) {
    logger.error(
      `MagicTeam CLI requires Node.js version ${REQUIRED_NODE_VERSION} or higher.`,
      `Current version: ${currentVersion}`
    );
    process.exit(1);
  }
}

export function checkNpmVersion(): string | null {
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    return version;
  } catch {
    return null;
  }
}

export function checkYarnVersion(): string | null {
  try {
    const version = execSync('yarn --version', { encoding: 'utf8' }).trim();
    return version;
  } catch {
    return null;
  }
}

export function checkPnpmVersion(): string | null {
  try {
    const version = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    return version;
  } catch {
    return null;
  }
}

export function getPackageManager(): 'npm' | 'yarn' | 'pnpm' {
  // 检查环境变量
  const npm_config_user_agent = process.env.npm_config_user_agent || '';
  
  if (npm_config_user_agent.includes('yarn')) {
    return 'yarn';
  }
  
  if (npm_config_user_agent.includes('pnpm')) {
    return 'pnpm';
  }
  
  // 检查可用的包管理器
  if (checkYarnVersion()) {
    return 'yarn';
  }
  
  if (checkPnpmVersion()) {
    return 'pnpm';
  }
  
  return 'npm';
}