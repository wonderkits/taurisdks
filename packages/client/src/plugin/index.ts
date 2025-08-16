/**
 * Plugin Domain - Tauri 插件领域
 * 
 * 提供 Tauri 插件的统一客户端实现：SQL、Store、FS
 */

export { Database, default as SqlClient } from './sql';
export { Store, default as StoreClient } from './store';
export { FsClient, default as FileSystemClient } from './fs';

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