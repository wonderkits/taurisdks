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
  AppRegistry
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
  HealthCheckResult
} from './plugin';

// 🛠️ 框架集成领域
export * from './framework';
