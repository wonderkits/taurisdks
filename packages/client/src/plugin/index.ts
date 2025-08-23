/**
 * Plugin Domain - Tauri 插件领域
 *
 * 提供 Tauri 插件的统一客户端实现：SQL、Store、FS、App Registry
 */

export { Database, default as SqlClient } from './sql';
export { Store, default as StoreClient } from './store';
export { FsClient, default as FileSystemClient } from './fs';
export { AppRegistryClient, default as AppRegistry } from './app-registry';

export type { SqlExecuteResult, SqlSelectResult, DatabaseOptions } from './sql';

export type { StoreLoadOptions } from './store';

export type { FsClientInitOptions, FileInfo, MkdirOptions, DirEntry } from './fs';

export type {
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
} from './app-registry';
