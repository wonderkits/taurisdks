/**
 * @magicteam/client - Universal Tauri Plugin Clients
 * 
 * 提供与 Tauri 插件完全兼容的 API，支持多种运行模式：
 * - Tauri Native: 直接使用 Tauri 插件
 * - Tauri Proxy: 通过主应用代理（Wujie 微前端）
 * - HTTP Bridge: 通过 HTTP 服务（开发/独立运行）
 * 
 * @version 1.0.0
 * @license MIT
 */

// 主要客户端
export { Database, default as SqlClient } from './sql';
export { Store, default as StoreClient } from './store';
export { FsClient, default as FileSystemClient } from './fs';

// 类型定义
export type * from './types';
export type {
  SqlExecuteResult,
  SqlSelectResult,
  DatabaseOptions
} from './sql';

export type {
  StoreLoadOptions
} from './store';

export type {
  FsClientInitOptions,
  FileInfo,
  MkdirOptions,
  DirEntry
} from './fs';

// 工具函数
export { environmentDetector, logger } from './utils';

// 导入类型和工具
import type { DatabaseOptions } from './sql';
import type { StoreLoadOptions } from './store';
import type { FsClientInitOptions } from './fs';
import { environmentDetector, logger } from './utils';

// 客户端工厂函数
export const createClients = {
  /**
   * 创建 SQL 客户端
   */
  sql: {
    async load(connectionString: string, options?: DatabaseOptions) {
      const { Database } = await import('./sql');
      return Database.load(connectionString, options);
    },
    
    async loadForDevelopment(connectionString: string, httpPort?: number) {
      const { Database } = await import('./sql');
      return Database.loadForDevelopment(connectionString, httpPort);
    }
  },

  /**
   * 创建 Store 客户端
   */
  store: {
    async load(filename: string, options?: StoreLoadOptions) {
      const { Store } = await import('./store');
      return Store.load(filename, options);
    },
    
    async loadForDevelopment(filename: string, httpPort?: number) {
      const { Store } = await import('./store');
      return Store.loadForDevelopment(filename, httpPort);
    }
  },

  /**
   * 创建 FS 客户端
   */
  fs: {
    async init(options?: FsClientInitOptions) {
      const { FsClient } = await import('./fs');
      return FsClient.init(options);
    },
    
    async initForDevelopment(httpPort?: number) {
      const { FsClient } = await import('./fs');
      return FsClient.initForDevelopment(httpPort);
    }
  }
};

// 便捷的开发工具
export const devUtils = {
  /**
   * 一键初始化所有客户端（开发模式）
   */
  async initAll(options: {
    sql?: { connectionString: string; httpPort?: number };
    store?: { filename: string; httpPort?: number };
    fs?: { httpPort?: number };
  } = {}) {
    const results: any = {};

    if (options.sql) {
      try {
        results.sql = await createClients.sql.loadForDevelopment(
          options.sql.connectionString,
          options.sql.httpPort
        );
        logger.success('SQL 客户端初始化成功');
      } catch (error) {
        logger.error('SQL 客户端初始化失败:', error);
      }
    }

    if (options.store) {
      try {
        results.store = await createClients.store.loadForDevelopment(
          options.store.filename,
          options.store.httpPort
        );
        logger.success('Store 客户端初始化成功');
      } catch (error) {
        logger.error('Store 客户端初始化失败:', error);
      }
    }

    if (options.fs) {
      try {
        results.fs = await createClients.fs.initForDevelopment(options.fs.httpPort);
        logger.success('FS 客户端初始化成功');
      } catch (error) {
        logger.error('FS 客户端初始化失败:', error);
      }
    }

    return results;
  },

  /**
   * 检测当前环境支持的客户端模式
   */
  detectSupport() {
    const support = {
      sql: {
        native: environmentDetector.isInTauri(),
        proxy: environmentDetector.isInWujie() && !!window.$wujie?.props?.tauriSql,
        http: true
      },
      store: {
        native: environmentDetector.isInTauri(),
        proxy: environmentDetector.isInWujie() && !!window.$wujie?.props?.tauriStore,
        http: true
      },
      fs: {
        native: environmentDetector.isInTauri(),
        proxy: environmentDetector.isInWujie() && !!window.$wujie?.props?.tauriFs,
        http: true
      }
    };

    logger.info('当前环境支持情况:', support);
    return support;
  }
};

// 版本信息
export const version = '1.0.0';

// 包信息
export const packageInfo = {
  name: '@magicteam/client',
  version,
  description: 'Universal Tauri plugin clients with intelligent multi-mode support',
  repository: 'https://github.com/magicteam/client',
  license: 'MIT'
};