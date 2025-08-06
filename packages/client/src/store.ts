/**
 * Tauri Store Plugin Universal Client
 * 提供与 @tauri-apps/plugin-store 完全一致的 API，支持多种运行模式
 * @magicteam/client
 */

import type { BaseClient, BaseClientOptions, ClientMode, ApiResponse } from './types';
import { environmentDetector, fetchWithErrorHandling, importTauriPlugin, retryWithFallback, logger } from './utils';

// Store 特定类型定义
export interface StoreLoadOptions extends BaseClientOptions {
  // Store 特定选项可以在这里扩展
}

/**
 * Store 客户端类
 * 支持 Tauri 原生、主应用代理、HTTP 服务三种模式
 */
export class Store implements BaseClient {
  readonly isHttpMode: boolean;
  readonly isProxyMode: boolean;
  readonly isTauriNative: boolean;

  constructor(
    private storeId: any,
    public readonly filename: string,
    private httpBaseUrl: string | null = null,
    private storeProxy: any = null
  ) {
    this.isHttpMode = !!httpBaseUrl;
    this.isProxyMode = !!storeProxy;
    this.isTauriNative = !httpBaseUrl && !storeProxy;
  }

  /**
   * 加载 Store - 完全兼容 @tauri-apps/plugin-store API
   */
  static async load(filename: string, options: StoreLoadOptions = {}): Promise<Store> {
    const { httpBaseUrl } = options;
    
    if (httpBaseUrl) {
      // 显式指定 HTTP 模式
      logger.info('显式使用 Store HTTP 模式');
      return await Store.loadViaHttp(filename, httpBaseUrl);
    }
    
    // 智能检测 Store 可用模式
    const storeMode = Store.detectStoreMode();
    
    switch (storeMode) {
      case 'tauri-native':
        logger.info('使用 Tauri 原生 Store 插件');
        return await Store.loadViaTauri(filename);
        
      case 'tauri-proxy':
        logger.info('使用主应用 Store 代理');
        return await Store.loadViaProxy(filename);
        
      case 'http':
      default:
        logger.info('使用 HTTP Store 服务');
        return await Store.loadViaHttp(filename, 'http://localhost:1421');
    }
  }

  /**
   * 通过 Tauri 原生 API 加载 Store
   */
  private static async loadViaTauri(filename: string): Promise<Store> {
    // 检查 Tauri 环境
    if (!environmentDetector.isInTauri()) {
      throw new Error('Tauri 环境不可用');
    }

    logger.debug('尝试导入 @tauri-apps/plugin-store...');
    const storeModule = await importTauriPlugin<any>('@tauri-apps/plugin-store');
    
    if (!storeModule.Store) {
      throw new Error('Store 插件模块导入失败或不完整');
    }

    const store = await storeModule.Store.load(filename);
    logger.success('Tauri 原生 Store 加载成功');
    
    return new Store(store, filename);
  }

  /**
   * 通过主应用代理加载 Store
   */
  private static async loadViaProxy(filename: string): Promise<Store> {
    // 检查代理是否可用
    if (!window.$wujie?.props?.tauriStore) {
      throw new Error('主应用 Store 代理不可用');
    }

    const storeProxy = window.$wujie.props.tauriStore;
    logger.debug('通过主应用代理加载 Store...');
    
    const storeId = await storeProxy.loadStore(filename);
    logger.success('主应用代理 Store 加载成功，Store ID:', storeId);
    
    return new Store(storeId, filename, null, storeProxy);
  }

  /**
   * 通过 HTTP API 加载 Store
   */
  private static async loadViaHttp(filename: string, httpBaseUrl: string): Promise<Store> {
    logger.debug(`${httpBaseUrl}/store/load`, filename);
    
    const response = await fetchWithErrorHandling(`${httpBaseUrl}/store/load`, {
      method: 'POST',
      body: JSON.stringify({ filename })
    });

    const result: ApiResponse<{ store_id: string }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to load store');
    }

    logger.success(`Store 加载成功，Store ID: ${result.data!.store_id}`);
    return new Store(result.data!.store_id, filename, httpBaseUrl);
  }

  /**
   * 设置键值 - 兼容 @tauri-apps/plugin-store API
   */
  async set(key: string, value: any): Promise<void> {
    if (this.isHttpMode) {
      return await this.setViaHttp(key, value);
    } else if (this.isProxyMode) {
      return await this.setViaProxy(key, value);
    } else {
      // Tauri 原生模式
      return await this.storeId.set(key, value);
    }
  }

  private async setViaProxy(key: string, value: any): Promise<void> {
    await this.storeProxy.setValue(this.storeId, key, value);
  }

  private async setViaHttp(key: string, value: any): Promise<void> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/set`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId,
        key,
        value
      })
    });

    const result: ApiResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to set value');
    }
  }

  /**
   * 获取键值 - 兼容 @tauri-apps/plugin-store API
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (this.isHttpMode) {
      return await this.getViaHttp<T>(key);
    } else if (this.isProxyMode) {
      return await this.getViaProxy<T>(key);
    } else {
      // Tauri 原生模式
      return await this.storeId.get(key);
    }
  }

  private async getViaProxy<T>(key: string): Promise<T | null> {
    const result = await this.storeProxy.getValue(this.storeId, key);
    return result.value;
  }

  private async getViaHttp<T>(key: string): Promise<T | null> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/get`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId,
        key
      })
    });

    const result: ApiResponse<{ value: T }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get value');
    }

    return result.data!.value;
  }

  /**
   * 删除键 - 兼容 @tauri-apps/plugin-store API
   */
  async delete(key: string): Promise<boolean> {
    if (this.isHttpMode) {
      return await this.deleteViaHttp(key);
    } else if (this.isProxyMode) {
      return await this.deleteViaProxy(key);
    } else {
      // Tauri 原生模式
      return await this.storeId.delete(key);
    }
  }

  private async deleteViaProxy(key: string): Promise<boolean> {
    const result = await this.storeProxy.deleteKey(this.storeId, key);
    return result.success;
  }

  private async deleteViaHttp(key: string): Promise<boolean> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/delete`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId,
        key
      })
    });

    const result: ApiResponse<{ success: boolean }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete key');
    }

    return result.data!.success;
  }

  /**
   * 清空 Store - 兼容 @tauri-apps/plugin-store API
   */
  async clear(): Promise<void> {
    if (this.isHttpMode) {
      return await this.clearViaHttp();
    } else if (this.isProxyMode) {
      return await this.clearViaProxy();
    } else {
      // Tauri 原生模式
      return await this.storeId.clear();
    }
  }

  private async clearViaProxy(): Promise<void> {
    await this.storeProxy.clearStore(this.storeId);
  }

  private async clearViaHttp(): Promise<void> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/clear`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId
      })
    });

    const result: ApiResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to clear store');
    }
  }

  /**
   * 获取所有键 - 兼容 @tauri-apps/plugin-store API
   */
  async keys(): Promise<string[]> {
    if (this.isHttpMode) {
      return await this.keysViaHttp();
    } else if (this.isProxyMode) {
      return await this.keysViaProxy();
    } else {
      // Tauri 原生模式
      return await this.storeId.keys();
    }
  }

  private async keysViaProxy(): Promise<string[]> {
    const result = await this.storeProxy.getKeys(this.storeId);
    return result.keys;
  }

  private async keysViaHttp(): Promise<string[]> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/keys`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId
      })
    });

    const result: ApiResponse<{ keys: string[] }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get keys');
    }

    return result.data!.keys;
  }

  /**
   * 获取所有值 - 兼容 @tauri-apps/plugin-store API
   */
  async values(): Promise<any[]> {
    if (this.isHttpMode) {
      return await this.valuesViaHttp();
    } else if (this.isProxyMode) {
      return await this.valuesViaProxy();
    } else {
      // Tauri 原生模式
      return await this.storeId.values();
    }
  }

  private async valuesViaProxy(): Promise<any[]> {
    const result = await this.storeProxy.getValues(this.storeId);
    return result.values;
  }

  private async valuesViaHttp(): Promise<any[]> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/values`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId
      })
    });

    const result: ApiResponse<{ values: any[] }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get values');
    }

    return result.data!.values;
  }

  /**
   * 获取所有条目 - 兼容 @tauri-apps/plugin-store API
   */
  async entries(): Promise<[string, any][]> {
    if (this.isHttpMode) {
      return await this.entriesViaHttp();
    } else if (this.isProxyMode) {
      return await this.entriesViaProxy();
    } else {
      // Tauri 原生模式
      return await this.storeId.entries();
    }
  }

  private async entriesViaProxy(): Promise<[string, any][]> {
    const result = await this.storeProxy.getEntries(this.storeId);
    return result.entries;
  }

  private async entriesViaHttp(): Promise<[string, any][]> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/entries`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId
      })
    });

    const result: ApiResponse<{ entries: [string, any][] }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get entries');
    }

    return result.data!.entries;
  }

  /**
   * 获取 Store 长度 - 兼容 @tauri-apps/plugin-store API
   */
  async length(): Promise<number> {
    if (this.isHttpMode) {
      return await this.lengthViaHttp();
    } else if (this.isProxyMode) {
      return await this.lengthViaProxy();
    } else {
      // Tauri 原生模式
      return await this.storeId.length();
    }
  }

  private async lengthViaProxy(): Promise<number> {
    const result = await this.storeProxy.getLength(this.storeId);
    return result.length;
  }

  private async lengthViaHttp(): Promise<number> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/length`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId
      })
    });

    const result: ApiResponse<{ length: number }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get length');
    }

    return result.data!.length;
  }

  /**
   * 手动保存 Store - 兼容 @tauri-apps/plugin-store API
   */
  async save(): Promise<void> {
    if (this.isHttpMode) {
      return await this.saveViaHttp();
    } else if (this.isProxyMode) {
      return await this.saveViaProxy();
    } else {
      // Tauri 原生模式
      return await this.storeId.save();
    }
  }

  private async saveViaProxy(): Promise<void> {
    await this.storeProxy.saveStore(this.storeId);
  }

  private async saveViaHttp(): Promise<void> {
    const response = await fetchWithErrorHandling(`${this.httpBaseUrl}/store/save`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId
      })
    });

    const result: ApiResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to save store');
    }
  }

  /**
   * 智能检测 Store 插件的可用方式
   */
  static detectStoreMode(): ClientMode {
    const baseMode = environmentDetector.detectMode();
    
    // 对于 tauri-proxy 模式，需要进一步检测代理是否可用
    if (baseMode === 'tauri-proxy') {
      if (window.$wujie?.props?.tauriStore) {
        logger.debug('检测到 Wujie 环境，发现主应用 Store 代理');
        return 'tauri-proxy';
      } else {
        logger.debug('检测到 Wujie 环境，但无 Store 代理，使用 HTTP 服务');
        return 'http';
      }
    }
    
    return baseMode;
  }

  /**
   * 获取所有活跃 Store - HTTP 模式专用工具方法
   */
  static async getStores(baseUrl = 'http://localhost:1421'): Promise<string[]> {
    const response = await fetchWithErrorHandling(`${baseUrl}/store/list`);
    const result: ApiResponse<{ stores: string[] }> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to get stores');
    }

    return result.data!.stores;
  }

}

// 默认导出
export default Store;