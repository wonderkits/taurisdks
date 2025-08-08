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

// 🎯 推荐使用：统一客户端管理器
export {
  WonderKitsClient,
  createWonderKitsClient,
  initForDevelopment
} from './client';

export type {
  WonderKitsClientConfig,
  ClientServices
} from './client';

// 🔧 独立客户端（向后兼容）
export { Database, default as SqlClient } from './sql';
export { Store, default as StoreClient } from './store';
export { FsClient, default as FileSystemClient } from './fs';

// 📝 类型定义
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

// 🛠️ 工具函数
export { environmentDetector, logger } from './utils';

// 🌐 Wujie 微前端集成
export {
  WujieUtils,
  WujieAppManager,
  createWujieApp,
  type WujieAppInfo
} from './wujie';

// 📊 版本信息
export const version = '1.0.0';

// 📦 包信息
export const packageInfo = {
  name: '@wonderkits/client',
  version,
  description: 'Universal Tauri plugin clients with intelligent multi-mode support',
  repository: 'https://github.com/wonderkits/taurisdks',
  license: 'MIT'
};

// 💡 React 集成提示
// 如果你在使用 React，推荐使用专门的 React 集成：
// import { useWonderKits, initWonderKits } from '@wonderkits/client/react';