/**
 * WonderKits Universal Client - 统一的客户端管理器
 * 
 * 提供统一的初始化和管理接口，避免每个服务重复 initForDevelopment 逻辑
 * 支持智能环境检测和统一配置管理
 * 
 * @version 1.0.0
 * @license MIT
 */

import type { BaseClientOptions, ClientMode } from './types';
import { environmentDetector, logger, retryWithFallback } from './utils';
import { Database } from './sql';
import { Store } from './store';
import { FsClient } from './fs';

export interface WonderKitsClientConfig {
  /** HTTP 服务端口（开发模式） */
  httpPort?: number;
  /** 强制指定运行模式 */
  forceMode?: ClientMode;
  /** 是否启用详细日志 */
  verbose?: boolean;
}

export interface ClientServices {
  sql?: {
    connectionString: string;
    options?: BaseClientOptions;
  };
  store?: {
    filename: string;
    options?: BaseClientOptions;
  };
  fs?: {
    options?: BaseClientOptions;
  };
}

/**
 * 统一的 WonderKits 客户端管理器
 */
export class WonderKitsClient {
  private config: WonderKitsClientConfig;
  private mode: ClientMode;
  private services: {
    sql?: Database;
    store?: Store;
    fs?: FsClient;
  } = {};

  constructor(config: WonderKitsClientConfig = {}) {
    this.config = {
      httpPort: 8080,
      verbose: false,
      ...config
    };

    // 检测运行模式
    this.mode = this.detectMode();
    
    if (this.config.verbose) {
      logger.info(`WonderKits Client 初始化, 运行模式: ${this.mode}`);
      this.logEnvironmentInfo();
    }
  }

  /**
   * 统一的环境检测逻辑
   */
  private detectMode(): ClientMode {
    if (this.config.forceMode) {
      return this.config.forceMode;
    }

    if (environmentDetector.isInTauri()) {
      return 'tauri-native';
    }

    if (environmentDetector.isInWujie()) {
      return 'tauri-proxy';
    }

    return 'http';
  }

  /**
   * 记录环境信息
   */
  private logEnvironmentInfo() {
    const info = {
      mode: this.mode,
      environment: {
        tauri: environmentDetector.isInTauri(),
        wujie: environmentDetector.isInWujie(),
        browser: environmentDetector.isBrowser(),
        node: environmentDetector.isNode()
      },
      config: this.config
    };
    
    logger.info('WonderKits Client 环境信息:', info);
  }

  /**
   * 获取当前运行模式
   */
  getMode(): ClientMode {
    return this.mode;
  }

  /**
   * 获取 HTTP 基础 URL（HTTP 模式时使用）
   */
  private getHttpBaseUrl(): string {
    return `http://localhost:${this.config.httpPort}`;
  }

  /**
   * 初始化指定的服务
   */
  async initServices(services: ClientServices): Promise<this> {
    const initPromises: Promise<void>[] = [];

    // 初始化 SQL 服务
    if (services.sql) {
      initPromises.push(this.initSqlService(services.sql));
    }

    // 初始化 Store 服务
    if (services.store) {
      initPromises.push(this.initStoreService(services.store));
    }

    // 初始化 FS 服务
    if (services.fs) {
      initPromises.push(this.initFsService(services.fs));
    }

    // 并行初始化所有服务
    await Promise.allSettled(initPromises);

    if (this.config.verbose) {
      logger.info('所有服务初始化完成:', Object.keys(this.services));
    }

    return this;
  }

  /**
   * 初始化 SQL 服务
   */
  private async initSqlService(config: NonNullable<ClientServices['sql']>): Promise<void> {
    try {
      const options = {
        ...config.options,
        httpBaseUrl: this.mode === 'http' ? this.getHttpBaseUrl() : undefined
      };

      // 使用智能重试逻辑
      this.services.sql = await retryWithFallback(
        () => Database.load(config.connectionString, options),
        () => Database.load(config.connectionString, {
          ...options,
          httpBaseUrl: this.getHttpBaseUrl()
        }),
        'SQL 智能初始化失败，尝试 HTTP 模式'
      );

      if (this.config.verbose) {
        logger.success(`SQL 服务初始化成功 (${this.mode} 模式)`);
      }
    } catch (error) {
      logger.error('SQL 服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化 Store 服务
   */
  private async initStoreService(config: NonNullable<ClientServices['store']>): Promise<void> {
    try {
      const options = {
        ...config.options,
        httpBaseUrl: this.mode === 'http' ? this.getHttpBaseUrl() : undefined
      };

      // 使用智能重试逻辑
      this.services.store = await retryWithFallback(
        () => Store.load(config.filename, options),
        () => Store.load(config.filename, {
          ...options,
          httpBaseUrl: this.getHttpBaseUrl()
        }),
        'Store 智能初始化失败，尝试 HTTP 模式'
      );

      if (this.config.verbose) {
        logger.success(`Store 服务初始化成功 (${this.mode} 模式)`);
      }
    } catch (error) {
      logger.error('Store 服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化 FS 服务
   */
  private async initFsService(config: NonNullable<ClientServices['fs']>): Promise<void> {
    try {
      const options = {
        ...config.options,
        httpBaseUrl: this.mode === 'http' ? this.getHttpBaseUrl() : undefined
      };

      // 使用智能重试逻辑
      this.services.fs = await retryWithFallback(
        () => FsClient.init(options),
        () => FsClient.init({
          ...options,
          httpBaseUrl: this.getHttpBaseUrl()
        }),
        'FS 智能初始化失败，尝试 HTTP 模式'
      );

      if (this.config.verbose) {
        logger.success(`FS 服务初始化成功 (${this.mode} 模式)`);
      }
    } catch (error) {
      logger.error('FS 服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取 SQL 客户端
   */
  sql(): Database {
    if (!this.services.sql) {
      throw new Error('SQL 服务未初始化，请先调用 initServices');
    }
    return this.services.sql;
  }

  /**
   * 获取 Store 客户端
   */
  store(): Store {
    if (!this.services.store) {
      throw new Error('Store 服务未初始化，请先调用 initServices');
    }
    return this.services.store;
  }

  /**
   * 获取 FS 客户端
   */
  fs(): FsClient {
    if (!this.services.fs) {
      throw new Error('FS 服务未初始化，请先调用 initServices');
    }
    return this.services.fs;
  }

  /**
   * 检查服务是否已初始化
   */
  isServiceInitialized(service: 'sql' | 'store' | 'fs'): boolean {
    return !!this.services[service];
  }

  /**
   * 获取所有已初始化的服务
   */
  getInitializedServices(): string[] {
    return Object.keys(this.services).filter(key => 
      this.services[key as keyof typeof this.services]
    );
  }

  /**
   * 销毁客户端，清理资源
   */
  async destroy(): Promise<void> {
    // 清理服务实例
    this.services = {};
    
    if (this.config.verbose) {
      logger.info('WonderKits Client 已销毁');
    }
  }
}

/**
 * 便捷的工厂函数
 */
export const createWonderKitsClient = (config?: WonderKitsClientConfig): WonderKitsClient => {
  return new WonderKitsClient(config);
};

/**
 * 快速开发模式初始化
 * 适用于开发环境快速启动所有服务
 */
export const initForDevelopment = async (
  services: ClientServices,
  config: WonderKitsClientConfig = {}
): Promise<WonderKitsClient> => {
  const client = createWonderKitsClient({
    verbose: true,
    ...config
  });

  await client.initServices(services);
  return client;
};