/**
 * WonderKits React State Management - Zustand Store
 * 
 * 提供 WonderKits 客户端的 React 状态管理，基于 Zustand
 * 集成日志、加载状态、连接状态等功能
 * 
 * @version 1.0.0
 * @license MIT
 */

import { create } from 'zustand';
import { WonderKitsClient, type WonderKitsClientConfig, type ClientServices } from '../../core/client';

export interface WonderKitsReactStore {
  // 状态
  client: WonderKitsClient | null;
  isConnected: boolean;
  isLoading: boolean;
  clientMode: string;
  logs: string[];
  error: string | null;
  
  // 服务配置缓存
  fsConfig: NonNullable<ClientServices['fs']> | null;
  storeConfig: NonNullable<ClientServices['store']> | null;
  sqlConfig: NonNullable<ClientServices['sql']> | null;
  
  // Actions
  addLog: (message: string) => void;
  clearLogs: () => void;
  setError: (error: string | null) => void;
  initClient: (services: ClientServices, config?: WonderKitsClientConfig) => Promise<void>;
  initWithServices: (options?: {
    enableFs?: boolean;
    enableStore?: boolean;
    enableSql?: boolean;
    storeFilename?: string;
    sqlConnectionString?: string;
    config?: WonderKitsClientConfig;
  }) => Promise<void>;
  disconnect: () => void;
  
  // 重置状态
  reset: () => void;
}

/**
 * 创建 WonderKits React Store
 * 
 * @param config 可选的客户端配置
 * @returns Zustand store
 */
export const createWonderKitsStore = (config?: WonderKitsClientConfig) => {
  return create<WonderKitsReactStore>((set, get) => ({
    // 初始状态
    client: null,
    isConnected: false,
    isLoading: false,
    clientMode: 'unknown',
    logs: [],
    error: null,
    
    fsConfig: null,
    storeConfig: null,
    sqlConfig: null,
    
    // 添加日志
    addLog: (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const logMessage = `[${timestamp}] ${message}`;
      
      set(state => ({
        logs: [...state.logs.slice(-19), logMessage] // 保留最近 20 条日志
      }));
    },
    
    // 清空日志
    clearLogs: () => set({ logs: [] }),
    
    // 设置错误
    setError: (error: string | null) => set({ error }),
    
    // 初始化客户端
    initClient: async (services: ClientServices, clientConfig?: WonderKitsClientConfig) => {
      const { addLog, setError } = get();
      
      set({ isLoading: true, error: null });
      
      try {
        addLog('🚀 正在初始化 WonderKits 统一客户端...');
        
        // 创建客户端实例
        const client = new WonderKitsClient({
          verbose: true,
          ...config,
          ...clientConfig
        });
        
        // 初始化服务
        await client.initServices(services);
        
        const mode = client.getMode();
        
        set({
          client,
          isConnected: true,
          clientMode: mode,
          // 保存服务配置
          fsConfig: services.fs || null,
          storeConfig: services.store || null,
          sqlConfig: services.sql || null
        });
        
        addLog(`✅ WonderKits 客户端初始化成功！运行模式: ${mode}`);
        
        // 记录已初始化的服务
        const initializedServices = client.getInitializedServices();
        if (initializedServices.length > 0) {
          addLog(`📋 已初始化服务: ${initializedServices.join(', ')}`);
        }
        
      } catch (error: any) {
        const errorMessage = `客户端初始化失败: ${error.message}`;
        addLog(`❌ ${errorMessage}`);
        setError(errorMessage);
        console.error('WonderKits client initialization failed:', error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },
    
    // 统一的服务初始化方法
    initWithServices: async (options = {}) => {
      const {
        enableFs = true,
        enableStore = true,
        enableSql = true,
        storeFilename = 'app-settings.json',
        sqlConnectionString = 'sqlite:app.db',
        config: clientConfig
      } = options;
      
      const { client, addLog } = get();
      
      // 如果客户端已存在且所有请求的服务都已初始化，跳过
      if (client) {
        const needInit = (enableFs && !client.isServiceInitialized('fs')) ||
                        (enableStore && !client.isServiceInitialized('store')) ||
                        (enableSql && !client.isServiceInitialized('sql'));
        
        if (!needInit) {
          addLog('⚠️ 所有请求的服务都已初始化，跳过重复初始化');
          return;
        }
      }
      
      // 构建服务配置
      const services: ClientServices = {};
      
      if (enableFs) {
        services.fs = {};
        addLog('📁 启用文件系统服务');
      }
      
      if (enableStore) {
        services.store = { filename: storeFilename };
        addLog(`💾 启用存储服务 (${storeFilename})`);
      }
      
      if (enableSql) {
        services.sql = { connectionString: sqlConnectionString };
        addLog(`🗃️ 启用数据库服务 (${sqlConnectionString})`);
      }
      
      // 如果没有启用任何服务，直接返回
      if (Object.keys(services).length === 0) {
        addLog('⚠️ 未指定要启用的服务');
        return;
      }
      
      await get().initClient(services, clientConfig);
    },
    
    // 断开连接
    disconnect: () => {
      const { addLog, client } = get();
      
      if (client) {
        addLog('🔌 断开 WonderKits 客户端连接');
        client.destroy();
      }
      
      set({
        client: null,
        isConnected: false,
        clientMode: 'unknown',
        error: null,
        fsConfig: null,
        storeConfig: null,
        sqlConfig: null
      });
      
      addLog('✅ 客户端已断开');
    },
    
    // 重置状态
    reset: () => {
      const { disconnect } = get();
      disconnect();
      set({
        logs: [],
        error: null
      });
    }
  }));
};

// 默认全局 store 实例
export const useWonderKitsStore = createWonderKitsStore();

// 导出 store 类型
export type WonderKitsStore = ReturnType<typeof createWonderKitsStore>;