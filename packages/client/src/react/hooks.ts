/**
 * WonderKits React Hooks
 * 
 * 提供便捷的 React Hooks 来使用 WonderKits 客户端
 * 
 * @version 1.0.0
 * @license MIT
 */

import { useWonderKitsStore, type WonderKitsStore } from './store';

/**
 * 获取 WonderKits 客户端实例
 */
export const useWonderKitsClient = () => {
  return useWonderKitsStore(state => state.client);
};

/**
 * 获取连接状态
 */
export const useWonderKitsConnected = () => {
  return useWonderKitsStore(state => state.isConnected);
};

/**
 * 获取加载状态
 */
export const useWonderKitsLoading = () => {
  return useWonderKitsStore(state => state.isLoading);
};

/**
 * 获取客户端运行模式
 */
export const useWonderKitsMode = () => {
  return useWonderKitsStore(state => state.clientMode);
};

/**
 * 获取日志列表
 */
export const useWonderKitsLogs = () => {
  return useWonderKitsStore(state => state.logs);
};

/**
 * 获取错误状态
 */
export const useWonderKitsError = () => {
  return useWonderKitsStore(state => state.error);
};

/**
 * 获取完整的状态和操作
 */
export const useWonderKits = () => {
  const client = useWonderKitsClient();
  const isConnected = useWonderKitsConnected();
  const isLoading = useWonderKitsLoading();
  const mode = useWonderKitsMode();
  const logs = useWonderKitsLogs();
  const error = useWonderKitsError();
  
  const actions = useWonderKitsStore(state => ({
    addLog: state.addLog,
    clearLogs: state.clearLogs,
    setError: state.setError,
    initClient: state.initClient,
    initWithServices: state.initWithServices,
    disconnect: state.disconnect,
    reset: state.reset
  }));
  
  return {
    // 状态
    client,
    isConnected,
    isLoading,
    mode,
    logs,
    error,
    
    // 操作
    ...actions
  };
};

/**
 * 使用 SQL 客户端
 */
export const useWonderKitsSql = () => {
  const client = useWonderKitsClient();
  const isConnected = useWonderKitsConnected();
  
  return {
    sql: client?.sql(),
    isAvailable: isConnected && client?.isServiceInitialized('sql')
  };
};

/**
 * 使用 Store 客户端
 */
export const useWonderKitsStoreClient = () => {
  const client = useWonderKitsClient();
  const isConnected = useWonderKitsConnected();
  
  return {
    store: client?.store(),
    isAvailable: isConnected && client?.isServiceInitialized('store')
  };
};

/**
 * 使用 FS 客户端
 */
export const useWonderKitsFs = () => {
  const client = useWonderKitsClient();
  const isConnected = useWonderKitsConnected();
  
  return {
    fs: client?.fs(),
    isAvailable: isConnected && client?.isServiceInitialized('fs')
  };
};

/**
 * 统一的服务状态检查 Hook
 */
export const useWonderKitsServiceStatus = () => {
  const client = useWonderKitsClient();
  const isConnected = useWonderKitsConnected();
  const { addLog } = useWonderKits();
  
  const checkServiceStatus = async (serviceType: 'sql' | 'store' | 'fs') => {
    if (!client) {
      addLog(`❌ ${serviceType.toUpperCase()} 服务不可用: 客户端未初始化`);
      return false;
    }
    
    if (!isConnected) {
      // 使用客户端的诊断信息
      const diagnostics = await client.getConnectionDiagnostics();
      addLog(`❌ ${serviceType.toUpperCase()} 服务不可用: ${diagnostics}`);
      return false;
    }
    
    if (!client.isServiceInitialized(serviceType)) {
      addLog(`❌ ${serviceType.toUpperCase()} 服务未初始化`);
      return false;
    }
    
    return true;
  };
  
  return { checkServiceStatus };
};

/**
 * 服务可用性检查 Hook
 */
export const useWonderKitsServices = () => {
  const client = useWonderKitsClient();
  const isConnected = useWonderKitsConnected();
  
  if (!client || !isConnected) {
    return {
      sql: false,
      store: false,
      fs: false,
      available: []
    };
  }
  
  const available = client.getInitializedServices();
  
  return {
    sql: client.isServiceInitialized('sql'),
    store: client.isServiceInitialized('store'),
    fs: client.isServiceInitialized('fs'),
    available
  };
};