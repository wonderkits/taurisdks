/**
 * App Registry React Hooks
 * 
 * 为 React 应用提供 App Registry 功能的 Hooks
 */

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

// 创建默认实例供 hooks 使用
const appRegistryClient = new AppRegistryClient();

// ============================================================================
// 类型定义
// ============================================================================

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

interface UseAppHealthResult {
  health: AppHealthStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseSystemStatusResult {
  status: SystemStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseAppStatsResult {
  stats: AppStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// 基础 Hooks
// ============================================================================

/**
 * 获取单个应用信息的 Hook
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

  return {
    app,
    loading,
    error,
    refresh,
    activate,
    deactivate,
    uninstall
  };
}

/**
 * 获取应用列表的 Hook
 */
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
    await refresh(); // 刷新列表
    return result;
  }, [refresh]);

  const bulkDeactivate = useCallback(async (appIds: string[]) => {
    const result = await appRegistryClient.bulkDeactivateApps(appIds);
    await refresh(); // 刷新列表
    return result;
  }, [refresh]);

  const bulkUninstall = useCallback(async (appIds: string[]) => {
    const result = await appRegistryClient.bulkUninstallApps(appIds);
    await refresh(); // 刷新列表
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

  return {
    apps,
    loading,
    error,
    refresh,
    bulkActivate,
    bulkDeactivate,
    bulkUninstall
  };
}

/**
 * 获取活跃应用列表的 Hook
 */
export function useActiveApps() {
  return useApps({ status: 'active', autoRefresh: true });
}

/**
 * 应用注册的 Hook
 */
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

  return {
    registerApp,
    devRegisterApp,
    registering,
    error
  };
}

// ============================================================================
// 监控 Hooks
// ============================================================================

/**
 * 获取应用健康状态的 Hook
 */
export function useAppHealth(appId: string | null, autoRefresh = false): UseAppHealthResult {
  const [health, setHealth] = useState<AppHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!appId) {
      setHealth(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await appRegistryClient.getAppHealth(appId);
      setHealth(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 自动刷新健康状态
  useEffect(() => {
    if (autoRefresh && appId) {
      intervalRef.current = setInterval(refresh, 10000); // 每10秒检查一次
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, appId, refresh]);

  return {
    health,
    loading,
    error,
    refresh
  };
}

/**
 * 获取系统状态的 Hook
 */
export function useSystemStatus(autoRefresh = false): UseSystemStatusResult {
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

  // 自动刷新系统状态
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, 30000); // 每30秒刷新一次
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refresh]);

  return {
    status,
    loading,
    error,
    refresh
  };
}

/**
 * 获取应用统计信息的 Hook
 */
export function useAppStats(autoRefresh = false): UseAppStatsResult {
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

  // 自动刷新统计信息
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, 60000); // 每分钟刷新一次
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refresh]);

  return {
    stats,
    loading,
    error,
    refresh
  };
}

// ============================================================================
// 实用 Hooks
// ============================================================================

/**
 * 获取应用事件历史的 Hook
 */
export function useAppEvents(appId: string | null, limit = 10) {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!appId) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await appRegistryClient.getAppEvents(appId, limit);
      setEvents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [appId, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    events,
    loading,
    error,
    refresh
  };
}

/**
 * 应用搜索的 Hook
 */
export function useAppSearch() {
  const [results, setResults] = useState<RegisteredApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, filters?: { status?: string; category?: string; author?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await appRegistryClient.searchApps(query, filters);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults
  };
}

/**
 * 检查应用是否存在的 Hook
 */
export function useAppExists(appId: string | null) {
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkExists = useCallback(async () => {
    if (!appId) {
      setExists(false);
      return;
    }

    setLoading(true);

    try {
      const result = await appRegistryClient.appExists(appId);
      setExists(result);
    } catch {
      setExists(false);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    checkExists();
  }, [checkExists]);

  return { exists, loading, refresh: checkExists };
}

/**
 * 等待应用状态变化的 Hook
 */
export function useAppStatusWatcher(appId: string | null) {
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const waitForStatus = useCallback(async (targetStatus: string, timeoutMs = 30000) => {
    if (!appId) return false;

    setIsWatching(true);

    try {
      const result = await appRegistryClient.waitForAppStatus(appId, targetStatus, timeoutMs);
      
      if (result) {
        setCurrentStatus(targetStatus);
      }
      
      return result;
    } finally {
      setIsWatching(false);
    }
  }, [appId]);

  // 获取当前状态
  useEffect(() => {
    if (!appId) return;

    const getCurrentStatus = async () => {
      try {
        const app = await appRegistryClient.getApp(appId);
        setCurrentStatus(app?.status || null);
      } catch {
        setCurrentStatus(null);
      }
    };

    getCurrentStatus();
  }, [appId]);

  return {
    currentStatus,
    isWatching,
    waitForStatus
  };
}

// ============================================================================
// 组合 Hooks
// ============================================================================

/**
 * 完整的应用管理 Hook，包含所有常用功能
 */
export function useAppManager(appId: string | null) {
  const app = useApp(appId);
  const health = useAppHealth(appId, true);
  const events = useAppEvents(appId, 5);
  const statusWatcher = useAppStatusWatcher(appId);

  return {
    ...app,
    health: health.health,
    healthLoading: health.loading,
    healthError: health.error,
    refreshHealth: health.refresh,
    events: events.events,
    eventsLoading: events.loading,
    eventsError: events.error,
    refreshEvents: events.refresh,
    currentStatus: statusWatcher.currentStatus,
    isWatchingStatus: statusWatcher.isWatching,
    waitForStatus: statusWatcher.waitForStatus
  };
}

/**
 * 系统总览 Hook，包含系统状态和统计信息
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