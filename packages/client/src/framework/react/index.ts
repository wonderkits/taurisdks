/**
 * @wonderkits/client/react - 简化版 React Integration
 * 
 * 为 WonderKits 客户端提供简洁的 React 集成：
 * - Zustand 状态管理
 * - 简化的 React Hooks
 * - 函数式初始化
 * - TypeScript 支持
 * - App Registry 管理
 * 
 * @version 1.1.0
 * @license MIT
 */

import { WujieUtils } from '../../core';

// 🎯 Core Store & Hooks
export {
  createWonderKitsStore,
  useWonderKitsStore,
  type WonderKitsReactStore,
  type WonderKitsStore
} from './store';

export {
  useWonderKits,
  useWonderKitsClient,
  useWonderKitsConnected,
  useWonderKitsLoading,
  initWonderKits,
  type WonderKitsReactConfig
} from './hooks';

// 🎯 App Registry Hooks
export {
  useApp,
  useApps,
  useActiveApps,
  useAppRegistration,
  useAppHealth,
  useSystemStatus,
  useAppStats,
  useAppEvents,
  useAppSearch,
  useAppExists,
  useAppStatusWatcher,
  useAppManager,
  useSystemOverview
} from './app-registry-hooks';


