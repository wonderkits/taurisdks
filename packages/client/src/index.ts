/**
 * @wonderkits/client - Universal Tauri Plugin Clients
 *
 * 提供与 Tauri 插件完全兼容的 API，支持多种运行模式：
 * - Tauri Native: 直接使用 Tauri 插件
 * - Tauri Proxy: 通过主应用代理（Wujie 微前端）
 * - HTTP Bridge: 通过 HTTP 服务（开发/独立运行）
 *
 * @version 1.0.0
 * @license MIT
 */

// 🎯 核心领域 - 统一客户端管理器
export {
  WonderKitsClient,
  createWonderKitsClient,
  initForDevelopment,
  environmentDetector,
  logger,
  WujieUtils,
  WujieAppManager,
  createWujieApp,
} from './core';

export type { WonderKitsClientConfig, ClientServices } from './core';

// 引入需要使用的类型和类
import { WonderKitsClient, createWonderKitsClient, type WonderKitsClientConfig, type ClientServices } from './core';

// ============================================================================
// 🎯 全局客户端管理 - 替代复杂的 React 状态管理
// ============================================================================

let globalClient: WonderKitsClient | null = null;
let initPromise: Promise<WonderKitsClient> | null = null;

/**
 * 简化的服务配置接口
 */
export interface WonderKitsSimpleConfig extends WonderKitsClientConfig {
  /** 服务配置 */
  services?: {
    fs?: boolean | object;
    store?: boolean | { filename?: string };
    sql?: boolean | { connectionString?: string };
    appRegistry?: boolean | object;
  };
}

/**
 * 全局初始化 WonderKits 客户端
 * 使用单例模式确保全局唯一实例
 */
export async function initWonderKits(config: WonderKitsSimpleConfig = {}): Promise<WonderKitsClient> {
  // 如果已经初始化过，直接返回
  if (globalClient) {
    console.warn('⚠️ WonderKits 已经初始化，返回现有实例');
    return globalClient;
  }

  // 如果正在初始化，等待完成
  if (initPromise) {
    return initPromise;
  }

  // 开始初始化
  initPromise = (async () => {
    const { services = {}, ...clientConfig } = config;
    
    // 构建服务配置 - 默认启用所有服务
    const clientServices: ClientServices = {};
    
    if (services.fs !== false) {
      clientServices.fs = typeof services.fs === 'object' ? services.fs : {};
    }
    
    if (services.store !== false) {
      const storeConfig = typeof services.store === 'object' ? services.store : {};
      clientServices.store = {
        filename: storeConfig.filename || 'app-settings.json',
        ...storeConfig
      };
    }
    
    if (services.sql !== false) {
      const sqlConfig = typeof services.sql === 'object' ? services.sql : {};
      clientServices.sql = {
        connectionString: sqlConfig.connectionString || 'sqlite:app.db',
        ...sqlConfig
      };
    }
    
    if (services.appRegistry !== false) {
      clientServices.appRegistry = typeof services.appRegistry === 'object' ? services.appRegistry : {};
    }

    // 创建客户端实例并初始化服务
    globalClient = createWonderKitsClient({
      verbose: true,
      ...clientConfig
    });
    
    await globalClient.initServices(clientServices);

    return globalClient;
  })();

  return initPromise;
}

/**
 * 获取全局 WonderKits 客户端实例
 * 如果未初始化则抛出错误
 */
export function getWonderKitsClient(): WonderKitsClient {
  if (!globalClient) {
    throw new Error('WonderKits client not initialized. Please call initWonderKits() first.');
  }
  return globalClient;
}

/**
 * 检查是否已初始化
 */
export const isWonderKitsInitialized = () => globalClient !== null;

/**
 * 获取各种服务的便捷函数
 */
export const getSql = () => getWonderKitsClient().sql();
export const getStore = () => getWonderKitsClient().store();
export const getFs = () => getWonderKitsClient().fs();
export const getAppRegistry = () => getWonderKitsClient().appRegistry();

/**
 * 重置全局客户端 (仅用于测试或特殊场景)
 */
export function resetWonderKits() {
  globalClient = null;
  initPromise = null;
}

export type * from './core';

// 🔌 插件领域 - Tauri 插件统一客户端
export {
  Database,
  SqlClient,
  Store,
  StoreClient,
  FsClient,
  FileSystemClient,
  AppRegistryClient,
  AppRegistry,
} from './plugin';

export type {
  SqlExecuteResult,
  SqlSelectResult,
  DatabaseOptions,
  StoreLoadOptions,
  FsClientInitOptions,
  FileInfo,
  MkdirOptions,
  DirEntry,
  AppManifest,
  AppConfig,
  RegisteredApp,
  AppHealthStatus,
  SystemStatus,
  AppEvent,
  BulkActionResponse,
  DevRegisterResponse,
  AppStats,
  SearchFilters,
  ValidationResult,
  HealthCheckResult,
} from './plugin';

// 🛠️ 如需 React Hooks，可以在 React 项目中简单创建：
/*
// React hooks 示例（可复制到你的 React 项目中）:
export const useWonderKits = () => getWonderKitsClient();
export const useSql = () => getSql();
export const useStore = () => getStore();
export const useFs = () => getFs();
export const useAppRegistry = () => getAppRegistry();
*/
