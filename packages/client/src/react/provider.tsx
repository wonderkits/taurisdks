/**
 * WonderKits React Provider (Optional)
 * 
 * 提供上下文化的 WonderKits 客户端管理
 * 支持多实例和配置隔离
 * 
 * @version 1.0.0
 * @license MIT
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { createWonderKitsStore, type WonderKitsStore } from './store';
import type { WonderKitsClientConfig, ClientServices } from '../client';

interface WonderKitsProviderProps {
  children: ReactNode;
  config?: WonderKitsClientConfig;
  autoInit?: {
    services: ClientServices;
    config?: WonderKitsClientConfig;
  };
}

// 创建 Context
const WonderKitsContext = createContext<WonderKitsStore | null>(null);

/**
 * WonderKits Provider 组件
 * 
 * 提供独立的 WonderKits 实例，适用于需要配置隔离的场景
 */
export const WonderKitsProvider: React.FC<WonderKitsProviderProps> = ({
  children,
  config,
  autoInit
}) => {
  // 创建独立的 store 实例
  const store = React.useMemo(() => createWonderKitsStore(config), [config]);
  
  // 自动初始化
  useEffect(() => {
    if (autoInit) {
      const { initClient } = store.getState();
      initClient(autoInit.services, autoInit.config).catch(error => {
        console.error('WonderKits auto-init failed:', error);
      });
    }
  }, [store, autoInit]);
  
  return (
    <WonderKitsContext.Provider value={store}>
      {children}
    </WonderKitsContext.Provider>
  );
};

/**
 * 使用上下文中的 WonderKits Store
 * 
 * 如果没有 Provider，回退到全局默认 store
 */
export const useWonderKitsContext = () => {
  const contextStore = useContext(WonderKitsContext);
  
  // 如果没有上下文，导入并使用默认的全局 store
  if (!contextStore) {
    // 动态导入以避免循环依赖
    const { useWonderKitsStore } = require('./store');
    return useWonderKitsStore;
  }
  
  return contextStore;
};

/**
 * 高阶组件：为组件提供 WonderKits 客户端
 */
export const withWonderKits = <P extends object>(
  Component: React.ComponentType<P>,
  config?: WonderKitsClientConfig
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <WonderKitsProvider config={config}>
      <Component {...props} />
    </WonderKitsProvider>
  );
  
  WrappedComponent.displayName = `withWonderKits(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};