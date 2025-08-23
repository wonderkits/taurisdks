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

// 🎯 App Registry Hooks - 已集成到主 hooks 文件
export {
  useApp,
  useApps,
  useActiveApps,
  useAppRegistration,
  useSystemStatus,
  useAppStats,
  useSystemOverview
} from './hooks';


