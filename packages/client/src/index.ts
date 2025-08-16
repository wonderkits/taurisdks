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
  logger
} from './core';

export type {
  WonderKitsClientConfig,
  ClientServices
} from './core';

export type * from './core';

// 🔌 插件领域 - Tauri 插件统一客户端
export {
  Database,
  SqlClient,
  Store,
  StoreClient,
  FsClient,
  FileSystemClient
} from './plugin';

export type {
  SqlExecuteResult,
  SqlSelectResult,
  DatabaseOptions,
  StoreLoadOptions,
  FsClientInitOptions,
  FileInfo,
  MkdirOptions,
  DirEntry
} from './plugin';

// 🌐 微应用领域 - 应用管理和 Wujie 集成
export {
  WujieUtils,
  WujieAppManager,
  createWujieApp
} from './microapp';

export type {
  WujieAppInfo,
  WujieConfig
} from './microapp';

export type * from './microapp';

// 🛠️ 框架集成领域
export * from './framework';

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