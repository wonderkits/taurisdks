/**
 * @wonderkits/client/react - React Integration
 * 
 * 为 WonderKits 客户端提供完整的 React 集成：
 * - Zustand 状态管理
 * - React Hooks
 * - Context Provider（可选）
 * - TypeScript 支持
 * 
 * @version 1.0.0
 * @license MIT
 */

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
  useWonderKitsMode,
  useWonderKitsLogs,
  useWonderKitsError,
  useWonderKitsSql,
  useWonderKitsStoreClient,
  useWonderKitsFs,
  useWonderKitsServices
} from './hooks';

// 🔧 Context Provider (Optional)
export {
  WonderKitsProvider,
  useWonderKitsContext,
  withWonderKits
} from './provider';

// 📝 Re-export core types for convenience
export type {
  WonderKitsClient,
  WonderKitsClientConfig,
  ClientServices
} from '../client';