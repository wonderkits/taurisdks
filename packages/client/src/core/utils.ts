/**
 * 工具函数和环境检测
 * @magicteam/client
 */

import type { ClientMode, RuntimeEnvironment, EnvironmentDetector } from './types';

/**
 * API 路径管理器 - 统一管理所有服务的 API 路径
 */
export class ApiPathManager {
  private baseUrl: string;
  private apiPrefix: string = '/api';

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除末尾的斜杠
  }

  /**
   * 获取完整的 API URL
   */
  private getApiUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${this.apiPrefix}${cleanPath}`;
  }

  // Health 检查
  health(): string {
    return this.getApiUrl('/health');
  }

  // SQL 相关路径
  sql = {
    load: (): string => this.getApiUrl('/sql/load'),
    execute: (): string => this.getApiUrl('/sql/execute'),
    select: (): string => this.getApiUrl('/sql/select'),
    close: (): string => this.getApiUrl('/sql/close'),
    connections: (): string => this.getApiUrl('/sql/connections'),
  };

  // Store 相关路径
  store = {
    load: (): string => this.getApiUrl('/store/load'),
    set: (): string => this.getApiUrl('/store/set'),
    get: (): string => this.getApiUrl('/store/get'),
    delete: (): string => this.getApiUrl('/store/delete'),
    clear: (): string => this.getApiUrl('/store/clear'),
    keys: (): string => this.getApiUrl('/store/keys'),
    values: (): string => this.getApiUrl('/store/values'),
    entries: (): string => this.getApiUrl('/store/entries'),
    length: (): string => this.getApiUrl('/store/length'),
    save: (): string => this.getApiUrl('/store/save'),
    reload: (): string => this.getApiUrl('/store/reload'),
    list: (): string => this.getApiUrl('/store/list'),
  };

  // FS 相关路径
  fs = {
    readText: (): string => this.getApiUrl('/fs/read-text'),
    readBinary: (): string => this.getApiUrl('/fs/read-binary'),
    writeText: (): string => this.getApiUrl('/fs/write-text'),
    writeBinary: (): string => this.getApiUrl('/fs/write-binary'),
    removeFile: (): string => this.getApiUrl('/fs/remove-file'),
    createDir: (): string => this.getApiUrl('/fs/create-dir'),
    removeDir: (): string => this.getApiUrl('/fs/remove-dir'),
    readDir: (): string => this.getApiUrl('/fs/read-dir'),
    metadata: (): string => this.getApiUrl('/fs/metadata'),
    exists: (): string => this.getApiUrl('/fs/exists'),
    copyFile: (): string => this.getApiUrl('/fs/copy-file'),
    renameFile: (): string => this.getApiUrl('/fs/rename-file'),
  };
}

/**
 * 环境检测器实现
 */
class EnvironmentDetectorImpl implements EnvironmentDetector {
  /**
   * 检测客户端运行模式
   */
  detectMode(): ClientMode {
    // 检测 1: 直接的 Tauri 环境
    if (this.isInTauri()) {
      console.log('🔍 检测到直接 Tauri 环境');
      return 'tauri-native';
    }
    
    // 检测 2: Wujie 环境中的主应用代理
    if (this.isInWujie()) {
      console.log('🔍 检测到 Wujie 环境，使用代理或 HTTP 服务');
      return 'tauri-proxy'; // 会在具体client中进一步检测代理可用性
    }
    
    console.log('🔍 独立开发环境，使用 HTTP 服务');
    return 'http';
  }

  /**
   * 获取运行环境类型
   */
  getEnvironment(): RuntimeEnvironment {
    const mode = this.detectMode();
    if (mode === 'tauri-native' || mode === 'tauri-proxy') {
      return 'tauri';
    } else if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return 'node';
    } else {
      return 'browser';
    }
  }

  /**
   * 检测是否在 Wujie 环境中
   */
  isInWujie(): boolean {
    return typeof window !== 'undefined' && !!window.__POWERED_BY_WUJIE__;
  }

  /**
   * 检测是否在 Tauri 环境中
   */
  isInTauri(): boolean {
    return typeof window !== 'undefined' && !!window.__TAURI__;
  }

  /**
   * 检测是否在浏览器环境中
   */
  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * 检测是否在 Node.js 环境中
   */
  isNode(): boolean {
    return typeof process !== 'undefined' && process.versions?.node !== undefined;
  }
}

// 导出单例实例
export const environmentDetector = new EnvironmentDetectorImpl();

/**
 * HTTP 请求工具函数
 */
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Request failed: ${String(error)}`);
  }
}

/**
 * 动态导入 Tauri 插件的工具函数
 */
export async function importTauriPlugin<T>(pluginName: string): Promise<T> {
  try {
    const module = await import(pluginName);
    if (!module) {
      throw new Error(`${pluginName} 插件模块导入失败或不完整`);
    }
    console.log(`✅ ${pluginName} 插件导入成功`);
    return module;
  } catch (error) {
    console.error(`❌ ${pluginName} 插件加载失败:`, error);
    throw new Error(
      `${pluginName} 插件加载失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 智能降级重试工具
 */
export async function retryWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await primaryFn();
  } catch (error) {
    console.error(errorMessage || '❌ 主方案失败，尝试降级方案:', (error as Error).message);
    return await fallbackFn();
  }
}

/**
 * 日志工具
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`ℹ️ ${message}`, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`✅ ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.log(`🔄 ${message}`, ...args);
  }
};