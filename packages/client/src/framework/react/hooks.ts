/**
 * WonderKits React Hooks - 简化版
 *
 * 提供简洁的 React Hooks 来使用 WonderKits 客户端
 *
 * @version 1.1.0
 * @license MIT
 */

import { useWonderKitsStore } from './store';
import type { WonderKitsClientConfig, ClientServices } from '../../core/client';
import { environmentDetector } from '../../core';
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AppRegistryClient,
  RegisteredApp,
  AppConfig,
  AppHealthStatus,
  SystemStatus,
  AppStats,
  AppEvent,
  BulkActionResponse,
  DevRegisterResponse
} from '../../plugin/app-registry';

/**
 * 主要的 WonderKits Hook - 获取完整状态和操作
 */
export const useWonderKits = () => {
  return useWonderKitsStore();
};

/**
 * WonderKits React 配置接口
 * 扩展了 WonderKitsClientConfig，添加了 React 特定的配置选项
 */
export interface WonderKitsReactConfig extends WonderKitsClientConfig {
  /** 是否启用文件系统服务 */
  enableFs?: boolean;
  /** 是否启用存储服务 */
  enableStore?: boolean;
  /** 是否启用数据库服务 */
  enableSql?: boolean;

  /** Store 文件名 */
  storeFilename?: string;
  /** SQL 连接字符串 */
  sqlConnectionString?: string;
}

/**
 * 函数式初始化 - 不依赖组件生命周期
 */
export const initWonderKits = async (config: WonderKitsReactConfig = {}) => {
  const {
    enableFs = true,
    enableStore = true,
    enableSql = true,
    storeFilename = 'app-settings.json',
    sqlConnectionString = 'sqlite:app.db',
    httpPort = 1420,
    httpHost = 'localhost',
    forceMode,
    verbose = true,
  } = config;

  const store = useWonderKitsStore.getState();

  // 如果已经连接且所有服务都已初始化，跳过
  if (store.isConnected && store.client) {
    const needInit =
      (enableFs && !store.client.isServiceInitialized('fs')) ||
      (enableStore && !store.client.isServiceInitialized('store')) ||
      (enableSql && !store.client.isServiceInitialized('sql'));

    if (!needInit) {
      store.addLog('⚠️ WonderKits 已经初始化，跳过重复初始化');
      return store.client;
    }
  }

  // 构建服务配置
  const services: ClientServices = {};

  if (enableFs) {
    services.fs = {};
    if (verbose) store.addLog('📁 启用文件系统服务');
  }

  if (enableStore) {
    services.store = { filename: storeFilename };
    if (verbose) store.addLog(`💾 启用存储服务 (${storeFilename})`);
  }

  if (enableSql) {
    services.sql = { connectionString: sqlConnectionString };
    if (verbose) store.addLog(`🗃️ 启用数据库服务 (${sqlConnectionString})`);
  }

  // 如果没有启用任何服务，直接返回
  if (Object.keys(services).length === 0) {
    store.addLog('⚠️ 未指定要启用的服务');
    return null;
  }

  const clientConfig: WonderKitsClientConfig = {
    httpPort,
    httpHost,
    forceMode,
    verbose,
  };

  if (verbose) {
    store.addLog('🚀 初始化 WonderKits 客户端...');
    store.addLog(`🔧 服务: SQL=${enableSql}, Store=${enableStore}, FS=${enableFs}`);
    store.addLog(`🌐 HTTP端口: ${httpPort}, 主机: ${httpHost}, 模式: ${forceMode || '自动检测'}`);
  }

  await store.initClient(services, clientConfig);

  if (verbose) {
    store.addLog('✅ WonderKits 客户端初始化完成');
  }

  return store.client;
};

// 保留一些常用的便捷 hooks，但简化实现
export const useWonderKitsClient = () => useWonderKitsStore(state => state.client);
export const useWonderKitsConnected = () => useWonderKitsStore(state => state.isConnected);
export const useWonderKitsLoading = () => useWonderKitsStore(state => state.isLoading);

// ============================================================================
// App Registry Hooks - 集成到统一 hooks 系统
// ============================================================================

// 创建默认实例供 hooks 使用
const appRegistryClient = new AppRegistryClient();

// 类型定义
interface UseAppsOptions {
  status?: string;
  category?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAppResult {
  app: RegisteredApp | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
  uninstall: () => Promise<void>;
}

interface UseAppsResult {
  apps: RegisteredApp[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  bulkActivate: (appIds: string[]) => Promise<BulkActionResponse>;
  bulkDeactivate: (appIds: string[]) => Promise<BulkActionResponse>;
  bulkUninstall: (appIds: string[]) => Promise<BulkActionResponse>;
}

interface UseAppRegistrationResult {
  registerApp: (config: AppConfig) => Promise<string>;
  devRegisterApp: (config: AppConfig, devUrl: string) => Promise<DevRegisterResponse>;
  registering: boolean;
  error: string | null;
}

/**
 * App Registry Hooks - 基础功能
 */
export function useApp(appId: string | null): UseAppResult {
  const [app, setApp] = useState<RegisteredApp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!appId) {
      setApp(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await appRegistryClient.getApp(appId);
      setApp(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  const activate = useCallback(async () => {
    if (!appId) return;
    try {
      await appRegistryClient.activateApp(appId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [appId, refresh]);

  const deactivate = useCallback(async () => {
    if (!appId) return;
    try {
      await appRegistryClient.deactivateApp(appId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [appId, refresh]);

  const uninstall = useCallback(async () => {
    if (!appId) return;
    try {
      await appRegistryClient.uninstallApp(appId);
      setApp(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [appId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { app, loading, error, refresh, activate, deactivate, uninstall };
}

export function useApps(options: UseAppsOptions = {}): UseAppsResult {
  const [apps, setApps] = useState<RegisteredApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { status, category, autoRefresh = false, refreshInterval = 30000 } = options;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await appRegistryClient.getApps({ status, category });
      setApps(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [status, category]);

  const bulkActivate = useCallback(async (appIds: string[]) => {
    const result = await appRegistryClient.bulkActivateApps(appIds);
    await refresh();
    return result;
  }, [refresh]);

  const bulkDeactivate = useCallback(async (appIds: string[]) => {
    const result = await appRegistryClient.bulkDeactivateApps(appIds);
    await refresh();
    return result;
  }, [refresh]);

  const bulkUninstall = useCallback(async (appIds: string[]) => {
    const result = await appRegistryClient.bulkUninstallApps(appIds);
    await refresh();
    return result;
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, refreshInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refresh]);

  return { apps, loading, error, refresh, bulkActivate, bulkDeactivate, bulkUninstall };
}

export function useActiveApps() {
  return useApps({ status: 'active', autoRefresh: true });
}

export function useAppRegistration(): UseAppRegistrationResult {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerApp = useCallback(async (config: AppConfig) => {
    setRegistering(true);
    setError(null);
    try {
      const result = await appRegistryClient.registerApp(config);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      throw err;
    } finally {
      setRegistering(false);
    }
  }, []);

  const devRegisterApp = useCallback(async (config: AppConfig, devUrl: string) => {
    setRegistering(true);
    setError(null);
    try {
      const result = await appRegistryClient.devRegisterApp(config, devUrl);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      throw err;
    } finally {
      setRegistering(false);
    }
  }, []);

  return { registerApp, devRegisterApp, registering, error };
}

/**
 * 系统监控相关 hooks
 */
export function useSystemStatus(autoRefresh = false) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await appRegistryClient.getSystemStatus();
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, 30000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refresh]);

  return { status, loading, error, refresh };
}

export function useAppStats(autoRefresh = false) {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await appRegistryClient.getAppStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, 60000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refresh]);

  return { stats, loading, error, refresh };
}

/**
 * 组合 Hook - 系统总览
 */
export function useSystemOverview() {
  const systemStatus = useSystemStatus(true);
  const appStats = useAppStats(true);
  const activeApps = useActiveApps();

  return {
    systemStatus: systemStatus.status,
    systemLoading: systemStatus.loading,
    systemError: systemStatus.error,
    refreshSystem: systemStatus.refresh,
    appStats: appStats.stats,
    statsLoading: appStats.loading,
    statsError: appStats.error,
    refreshStats: appStats.refresh,
    activeApps: activeApps.apps,
    activeAppsLoading: activeApps.loading,
    activeAppsError: activeApps.error,
    refreshActiveApps: activeApps.refresh
  };
}
