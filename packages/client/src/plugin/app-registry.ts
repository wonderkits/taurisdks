/**
 * App Registry Plugin - 应用注册中心插件
 * 
 * 提供应用注册、管理和监控的统一客户端实现
 * 参考 SQL/Store/FS 插件的多模式统一接口设计
 * 支持 Tauri 原生、主应用代理、HTTP 服务三种模式
 */

import type { BaseClient, BaseClientOptions, ClientMode, ApiResponse } from '../core/types';
import { environmentDetector, fetchWithErrorHandling, importTauriPlugin, retryWithFallback, logger, ApiPathManager } from '../core/utils';

// ============================================================================
// 类型定义 (从原文件复制)
// ============================================================================

export interface AppManifest {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  category?: string;
  type?: string;
}

export interface AppConfig {
  manifest: AppManifest;
  navigation?: {
    name: string;
    href: string;
    icon?: string;
    order?: number;
  };
  routes?: Array<{
    path: string;
    component: string;
  }>;
  hooks?: {
    onActivate?: string;
    onDeactivate?: string;
    onError?: string;
  };
}

export interface RegisteredApp {
  id: string;
  name: string;
  display_name: string;
  version: string;
  description?: string;
  author?: string;
  category?: string;
  app_type: string;
  config_json: string;
  status: string;
  error_message?: string;
  dev_url?: string;
  prod_path?: string;
  created_at: string;
  updated_at: string;
  last_activated_at?: string;
  last_access_at?: string;
}

export interface AppHealthStatus {
  app_id: string;
  status: string;
  last_check: string;
  response_time?: number;
  error_message?: string;
}

export interface SystemStatus {
  total_apps: number;
  active_apps: number;
  inactive_apps: number;
  error_apps: number;
  system_version: string;
  uptime: number;
  last_updated: string;
}

export interface AppEvent {
  id?: number;
  app_id: string;
  event_type: string;
  event_data?: string;
  created_at: string;
}

export interface BulkActionResponse {
  successful: string[];
  failed: Array<{
    app_id: string;
    error: string;
  }>;
}

export interface DevRegisterResponse {
  app_id: string;
  action: string; // "created" | "updated"
}

export interface AppStats {
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  total: number;
}

export interface SearchFilters {
  status?: string;
  category?: string;
  author?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface HealthCheckResult {
  healthy: boolean;
  message: string;
  timestamp: number;
}

export interface AppRegistryOptions extends BaseClientOptions {
  // App Registry 特定选项可以在这里扩展
}

// ============================================================================
// 应用注册中心客户端实现
// ============================================================================

/**
 * 应用注册中心客户端
 * 支持 Tauri 原生、主应用代理、HTTP 服务三种模式
 */
export class AppRegistryClient implements BaseClient {
  readonly isHttpMode: boolean;
  readonly isProxyMode: boolean;
  readonly isTauriNative: boolean;
  private apiPathManager?: ApiPathManager;
  private appRegistryProxy: any = null;

  constructor(
    private httpBaseUrl: string | null = null,
    appRegistryProxy: any = null
  ) {
    this.isHttpMode = !!httpBaseUrl;
    this.isProxyMode = !!appRegistryProxy;
    this.isTauriNative = !httpBaseUrl && !appRegistryProxy;
    this.appRegistryProxy = appRegistryProxy;
    
    // 初始化 API 路径管理器
    if (this.httpBaseUrl) {
      this.apiPathManager = new ApiPathManager(this.httpBaseUrl);
    }
  }

  /**
   * 创建 App Registry 客户端 - 智能模式选择
   */
  static async create(options: AppRegistryOptions = {}): Promise<AppRegistryClient> {
    const { httpBaseUrl } = options;
    
    if (httpBaseUrl) {
      // 显式指定 HTTP 模式
      logger.info('显式使用 App Registry HTTP 模式');
      return AppRegistryClient.createViaHttp(httpBaseUrl);
    }
    
    // 智能检测可用模式
    const mode = AppRegistryClient.detectAppRegistryMode();
    
    switch (mode) {
      case 'tauri-native':
        logger.info('使用 Tauri 原生 App Registry');
        return AppRegistryClient.createViaTauri();
        
      case 'tauri-proxy':
        logger.info('使用主应用 App Registry 代理');
        return AppRegistryClient.createViaProxy();
        
      case 'http':
      default:
        logger.info('使用 HTTP App Registry 服务');
        return AppRegistryClient.createViaHttp('http://localhost:1421');
    }
  }

  /**
   * 检测 App Registry 可用模式
   */
  private static detectAppRegistryMode(): ClientMode {
    // 检测 1: 直接的 Tauri 环境
    if (environmentDetector.isInTauri()) {
      logger.debug('🔍 检测到直接 Tauri 环境');
      return 'tauri-native';
    }
    
    // 检测 2: Wujie 环境中的主应用代理
    if (environmentDetector.isInWujie()) {
      logger.debug('🔍 检测到 Wujie 环境，检查代理可用性');
      try {
        if (typeof window !== 'undefined' && window.$wujie?.props?.appRegistry) {
          logger.debug('✅ App Registry 代理可用');
          return 'tauri-proxy';
        } else {
          logger.debug('⚠️  App Registry 代理不可用，回退到 HTTP 模式');
          return 'http';
        }
      } catch (error) {
        logger.debug('⚠️  代理访问错误，回退到 HTTP 模式');
        return 'http';
      }
    }
    
    logger.debug('🔍 独立开发环境，使用 HTTP 服务');
    return 'http';
  }

  /**
   * 通过 Tauri 原生 API 创建客户端
   */
  private static async createViaTauri(): Promise<AppRegistryClient> {
    // 检查 Tauri 环境
    if (!environmentDetector.isInTauri()) {
      throw new Error('Tauri 环境不可用');
    }

    // App Registry 通过 Tauri invoke 调用，无需导入特定插件
    logger.success('Tauri 原生 App Registry 客户端创建成功');
    return new AppRegistryClient();
  }

  /**
   * 通过主应用代理创建客户端
   */
  private static async createViaProxy(): Promise<AppRegistryClient> {
    // 检查代理是否可用
    if (!window.$wujie?.props?.appRegistry) {
      throw new Error('主应用 App Registry 代理不可用');
    }

    const appRegistryProxy = window.$wujie.props.appRegistry;
    logger.success('主应用代理 App Registry 客户端创建成功');
    
    return new AppRegistryClient(null, appRegistryProxy);
  }

  /**
   * 通过 HTTP API 创建客户端
   */
  private static async createViaHttp(httpBaseUrl: string): Promise<AppRegistryClient> {
    const apiPathManager = new ApiPathManager(httpBaseUrl);
    logger.debug('验证 HTTP App Registry 服务连接...');
    
    // 验证服务可用性
    try {
      const response = await fetchWithErrorHandling(apiPathManager.health());
      const healthData = await response.json();
      
      if (healthData.status === 'ok') {
        logger.success('HTTP App Registry 服务连接验证成功');
      } else {
        logger.warn('HTTP App Registry 服务状态异常，但继续创建客户端');
      }
    } catch (error) {
      logger.warn('HTTP App Registry 服务连接验证失败，但继续创建客户端', error);
    }

    return new AppRegistryClient(httpBaseUrl);
  }

  /**
   * 检查客户端是否已初始化
   */
  isReady(): boolean {
    return true; // 所有模式都是即时可用的
  }

  // ============================================================================
  // 应用基本管理 - 多模式实现
  // ============================================================================

  /**
   * 获取应用列表
   */
  async getApps(options?: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<RegisteredApp[]> {
    if (this.isHttpMode) {
      return await this.getAppsViaHttp(options);
    } else if (this.isProxyMode) {
      return await this.getAppsViaProxy(options);
    } else {
      // Tauri 原生模式
      return await this.getAppsViaTauri(options);
    }
  }

  private async getAppsViaTauri(options?: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<RegisteredApp[]> {
    const tauriCore = await importTauriPlugin('@tauri-apps/api/core') as any;
    return tauriCore.invoke('get_apps', {
      status: options?.status,
      category: options?.category,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  private async getAppsViaProxy(options?: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<RegisteredApp[]> {
    return this.appRegistryProxy.getApps({
      status: options?.status,
      category: options?.category,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  private async getAppsViaHttp(options?: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<RegisteredApp[]> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.category) params.append('category', options.category);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const query = params.toString();
    const url = query ? `${this.apiPathManager!.appRegistry.getApps()}?${query}` : this.apiPathManager!.appRegistry.getApps();
    
    const response = await fetchWithErrorHandling(url);
    const result: ApiResponse<RegisteredApp[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to get apps');
    }

    return result.data!;
  }

  /**
   * 获取单个应用详情
   */
  async getApp(appId: string): Promise<RegisteredApp | null> {
    if (this.isHttpMode) {
      return await this.getAppViaHttp(appId);
    } else if (this.isProxyMode) {
      return await this.getAppViaProxy(appId);
    } else {
      return await this.getAppViaTauri(appId);
    }
  }

  private async getAppViaTauri(appId: string): Promise<RegisteredApp | null> {
    const tauriCore = await importTauriPlugin('@tauri-apps/api/core') as any;
    return tauriCore.invoke('get_app', {
      app_id: appId,
    });
  }

  private async getAppViaProxy(appId: string): Promise<RegisteredApp | null> {
    return this.appRegistryProxy.getApp(appId);
  }

  private async getAppViaHttp(appId: string): Promise<RegisteredApp | null> {
    try {
      const response = await fetchWithErrorHandling(this.apiPathManager!.appRegistry.getApp(appId));
      const result: ApiResponse<RegisteredApp> = await response.json();
      
      if (!result.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(result.message || 'Failed to get app');
      }

      return result.data!;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 应用注册系统健康检查
   */
  async healthCheck(): Promise<HealthCheckResult> {
    if (this.isHttpMode) {
      return await this.healthCheckViaHttp();
    } else if (this.isProxyMode) {
      return await this.healthCheckViaProxy();
    } else {
      return await this.healthCheckViaTauri();
    }
  }

  private async healthCheckViaTauri(): Promise<HealthCheckResult> {
    const tauriCore = await importTauriPlugin('@tauri-apps/api/core') as any;
    return tauriCore.invoke('app_registry_health_check');
  }

  private async healthCheckViaProxy(): Promise<HealthCheckResult> {
    return this.appRegistryProxy.healthCheck();
  }

  private async healthCheckViaHttp(): Promise<HealthCheckResult> {
    try {
      const response = await fetchWithErrorHandling(this.apiPathManager!.health());
      const data = await response.json();
      
      return {
        healthy: response.ok && data.status === 'ok',
        message: data.message || 'Health check completed',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  // ============================================================================
  // 通用调用方法 - 简化其他方法的实现
  // ============================================================================

  /**
   * 通用的调用方法 - 根据模式选择合适的实现
   */
  private async invoke<T>(command: string, args?: Record<string, any>): Promise<T> {
    if (this.isHttpMode) {
      // HTTP 模式暂时只实现了基础方法，其他方法抛出错误
      throw new Error(`HTTP mode does not support command: ${command}`);
    } else if (this.isProxyMode) {
      // 代理模式：通过主应用代理调用
      const methodName = this.commandToMethodName(command);
      if (typeof this.appRegistryProxy[methodName] === 'function') {
        return this.appRegistryProxy[methodName](args);
      } else {
        throw new Error(`Proxy does not support command: ${command}`);
      }
    } else {
      // Tauri 原生模式
      const tauriCore = await importTauriPlugin('@tauri-apps/api/core') as any;
      return tauriCore.invoke(command, args);
    }
  }

  /**
   * 将 Tauri 命令转换为方法名
   */
  private commandToMethodName(command: string): string {
    return command.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  // ============================================================================
  // 简化的方法实现 - 使用通用调用
  // ============================================================================

  async registerApp(config: AppConfig): Promise<string> {
    return this.invoke<string>('register_app', { config });
  }

  async devRegisterApp(config: AppConfig, devUrl: string): Promise<DevRegisterResponse> {
    return this.invoke<DevRegisterResponse>('dev_register_app', { config, dev_url: devUrl });
  }

  async uninstallApp(appId: string): Promise<string> {
    return this.invoke<string>('uninstall_app', { app_id: appId });
  }

  async activateApp(appId: string): Promise<string> {
    return this.invoke<string>('activate_app', { app_id: appId });
  }

  async deactivateApp(appId: string): Promise<string> {
    return this.invoke<string>('deactivate_app', { app_id: appId });
  }

  async getActiveApps(): Promise<RegisteredApp[]> {
    return this.invoke<RegisteredApp[]>('get_active_apps');
  }

  async bulkActionApps(action: string, appIds: string[]): Promise<BulkActionResponse> {
    return this.invoke<BulkActionResponse>('bulk_action_apps', { action, app_ids: appIds });
  }

  async getAppHealth(appId: string): Promise<AppHealthStatus> {
    return this.invoke<AppHealthStatus>('get_app_health', { app_id: appId });
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.invoke<SystemStatus>('get_system_status');
  }

  async getAppStats(): Promise<AppStats> {
    return this.invoke<AppStats>('get_app_stats');
  }

  async getAppEvents(appId: string, limit?: number): Promise<AppEvent[]> {
    return this.invoke<AppEvent[]>('get_app_events', { app_id: appId, limit });
  }

  async searchApps(query: string, filters?: SearchFilters): Promise<RegisteredApp[]> {
    return this.invoke<RegisteredApp[]>('search_apps', { query, filters });
  }

  async validateAppConfig(config: AppConfig): Promise<ValidationResult> {
    return this.invoke<ValidationResult>('validate_app_config', { config });
  }

  async cleanupAppCache(appId?: string): Promise<string> {
    return this.invoke<string>('cleanup_app_cache', { app_id: appId });
  }

  // ============================================================================
  // 高级功能 - 保持现有实现
  // ============================================================================

  async bulkActivateApps(appIds: string[]): Promise<BulkActionResponse> {
    return this.bulkActionApps('activate', appIds);
  }

  async bulkDeactivateApps(appIds: string[]): Promise<BulkActionResponse> {
    return this.bulkActionApps('deactivate', appIds);
  }

  async bulkUninstallApps(appIds: string[]): Promise<BulkActionResponse> {
    return this.bulkActionApps('uninstall', appIds);
  }

  async getAppsByStatus(status: string): Promise<RegisteredApp[]> {
    return this.getApps({ status });
  }

  async getAppsByCategory(category: string): Promise<RegisteredApp[]> {
    return this.getApps({ category });
  }

  async appExists(appId: string): Promise<boolean> {
    try {
      const app = await this.getApp(appId);
      return app !== null;
    } catch {
      return false;
    }
  }

  async isAppActive(appId: string): Promise<boolean> {
    try {
      const app = await this.getApp(appId);
      return app?.status === 'active';
    } catch {
      return false;
    }
  }

  async waitForAppStatus(appId: string, targetStatus: string, timeoutMs = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const app = await this.getApp(appId);
        if (app?.status === targetStatus) {
          return true;
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch {
        // 忽略错误，继续重试
      }
    }
    
    return false;
  }

  async cleanup(): Promise<void> {
    console.log('✅ AppRegistry client cleanup completed');
  }
}

// ============================================================================
// 全局实例和导出
// ============================================================================

/**
 * 默认导出 - 遵循 SQL/Store 的模式
 */
export default AppRegistryClient;

// 创建默认实例的工厂函数
export const createAppRegistry = AppRegistryClient.create;