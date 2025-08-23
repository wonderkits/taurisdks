/**
 * Tauri SQL Plugin Universal Client
 * 提供与 @tauri-apps/plugin-sql 完全一致的 API，支持多种运行模式
 * @magicteam/client
 */

import type { BaseClient, BaseClientOptions, ClientMode, ApiResponse } from '../core/types';
import {
  environmentDetector,
  fetchWithErrorHandling,
  importTauriPlugin,
  retryWithFallback,
  logger,
  ApiPathManager,
} from '../core/utils';

// SQL 特定类型定义
export interface SqlExecuteResult {
  rowsAffected: number;
  lastInsertId?: number | null;
}

export interface SqlSelectResult<T = any> {
  data: T[];
}

export interface DatabaseOptions extends BaseClientOptions {
  // SQL 特定选项可以在这里扩展
}

/**
 * 数据库客户端类
 * 支持 Tauri 原生、主应用代理、HTTP 服务三种模式
 */
export class Database implements BaseClient {
  readonly isHttpMode: boolean;
  readonly isProxyMode: boolean;
  readonly isTauriNative: boolean;
  private apiPathManager?: ApiPathManager;

  constructor(
    private connectionId: string | any,
    private httpBaseUrl: string | null = null,
    private sqlProxy: any = null
  ) {
    this.isHttpMode = !!httpBaseUrl;
    this.isProxyMode = !!sqlProxy;
    this.isTauriNative = !httpBaseUrl && !sqlProxy;

    // 初始化 API 路径管理器
    if (this.httpBaseUrl) {
      this.apiPathManager = new ApiPathManager(this.httpBaseUrl);
    }
  }

  /**
   * 加载数据库连接 - 完全兼容 @tauri-apps/plugin-sql API
   */
  static async load(connectionString: string, options: DatabaseOptions = {}): Promise<Database> {
    const { httpBaseUrl } = options;

    if (httpBaseUrl) {
      // 显式指定 HTTP 模式
      logger.info('显式使用 HTTP 模式');
      return await Database.loadViaHttp(connectionString, httpBaseUrl);
    }

    // 智能检测 SQL 可用模式
    const sqlMode = Database.detectSqlMode();

    switch (sqlMode) {
      case 'tauri-native':
        logger.info('使用 Tauri 原生 SQL 插件');
        return await Database.loadViaTauri(connectionString);

      case 'tauri-proxy':
        logger.info('使用主应用 SQL 代理');
        return await Database.loadViaProxy(connectionString);

      case 'http':
      default:
        logger.info('使用 HTTP SQL 服务');
        return await Database.loadViaHttp(connectionString, 'http://localhost:1421');
    }
  }

  /**
   * 通过 Tauri 原生 API 加载数据库
   */
  private static async loadViaTauri(connectionString: string): Promise<Database> {
    // 检查 Tauri 环境
    if (!environmentDetector.isInTauri()) {
      throw new Error('Tauri 环境不可用');
    }

    logger.debug('尝试导入 @tauri-apps/plugin-sql...');
    const sqlModule = await importTauriPlugin<any>('@tauri-apps/plugin-sql');

    if (!sqlModule.Database) {
      throw new Error('SQL 插件模块导入失败或不完整');
    }

    const db = await sqlModule.Database.load(connectionString);
    logger.success('Tauri 原生数据库连接创建成功');

    return new Database(db);
  }

  /**
   * 通过主应用代理加载数据库
   */
  private static async loadViaProxy(connectionString: string): Promise<Database> {
    // 检查代理是否可用
    if (!window.$wujie?.props?.tauriSql) {
      throw new Error('主应用 SQL 代理不可用');
    }

    const sqlProxy = window.$wujie.props.tauriSql;
    logger.debug('通过主应用代理加载数据库...');

    const connectionId = await sqlProxy.loadConnection(connectionString);
    logger.success('主应用代理数据库连接创建成功，连接ID:', connectionId);

    return new Database(connectionId, null, sqlProxy);
  }

  /**
   * 通过 HTTP API 加载数据库
   */
  private static async loadViaHttp(
    connectionString: string,
    httpBaseUrl: string
  ): Promise<Database> {
    const apiPathManager = new ApiPathManager(httpBaseUrl);
    logger.debug(apiPathManager.sql.load(), connectionString);

    const response = await fetchWithErrorHandling(apiPathManager.sql.load(), {
      method: 'POST',
      body: JSON.stringify({
        connection_string: connectionString,
      }),
    });

    const result: ApiResponse<{ connection_id: string }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to load database');
    }

    logger.success(`数据库连接创建成功，连接 ID: ${result.data!.connection_id}`);
    return new Database(result.data!.connection_id, httpBaseUrl);
  }

  /**
   * 执行 SQL 语句 - 完全兼容 @tauri-apps/plugin-sql API
   */
  async execute(sql: string, params: any[] = []): Promise<SqlExecuteResult> {
    if (this.isHttpMode) {
      return await this.executeViaHttp(sql, params);
    } else if (this.isProxyMode) {
      return await this.executeViaProxy(sql, params);
    } else {
      // Tauri 原生模式
      return await this.connectionId.execute(sql, params);
    }
  }

  private async executeViaProxy(sql: string, params: any[]): Promise<SqlExecuteResult> {
    const result = await this.sqlProxy.execute(this.connectionId, sql, params);
    return {
      rowsAffected: result.rowsAffected,
      lastInsertId: result.lastInsertId,
    };
  }

  private async executeViaHttp(sql: string, params: any[]): Promise<SqlExecuteResult> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.sql.execute(), {
      method: 'POST',
      body: JSON.stringify({
        connection_id: this.connectionId,
        sql,
        params,
      }),
    });

    const result: ApiResponse<{ rows_affected: number; last_insert_id?: number }> =
      await response.json();
    if (!result.success) {
      throw new Error(result.message || 'SQL execution failed');
    }

    return {
      rowsAffected: result.data!.rows_affected,
      lastInsertId: result.data!.last_insert_id || null,
    };
  }

  /**
   * 查询数据 - 完全兼容 @tauri-apps/plugin-sql API
   */
  async select<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.isHttpMode) {
      return await this.selectViaHttp<T>(sql, params);
    } else if (this.isProxyMode) {
      return await this.selectViaProxy<T>(sql, params);
    } else {
      // Tauri 原生模式
      return await this.connectionId.select(sql, params);
    }
  }

  private async selectViaProxy<T>(sql: string, params: any[]): Promise<T[]> {
    const result = await this.sqlProxy.select(this.connectionId, sql, params);
    return result.data;
  }

  private async selectViaHttp<T>(sql: string, params: any[]): Promise<T[]> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.sql.select(), {
      method: 'POST',
      body: JSON.stringify({
        connection_id: this.connectionId,
        sql,
        params,
      }),
    });

    const result: ApiResponse<{ data: T[] }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'SQL query failed');
    }

    return result.data!.data;
  }

  /**
   * 关闭数据库连接 - 完全兼容 @tauri-apps/plugin-sql API
   */
  async close(): Promise<boolean> {
    if (this.isHttpMode) {
      return await this.closeViaHttp();
    } else if (this.isProxyMode) {
      return await this.closeViaProxy();
    } else {
      // Tauri 原生模式
      return await this.connectionId.close();
    }
  }

  private async closeViaProxy(): Promise<boolean> {
    const success = await this.sqlProxy.closeConnection(this.connectionId);
    if (success) {
      logger.success(`代理数据库连接 ${this.connectionId} 已关闭`);
      this.connectionId = null;
    }
    return success;
  }

  private async closeViaHttp(): Promise<boolean> {
    if (!this.connectionId) {
      logger.warn('Database not connected.');
      return false;
    }

    const response = await fetchWithErrorHandling(this.apiPathManager!.sql.close(), {
      method: 'POST',
      body: JSON.stringify({
        connection_id: this.connectionId,
      }),
    });

    const result: ApiResponse<{ success: boolean }> = await response.json();
    if (result.success && result.data!.success) {
      logger.success(`数据库连接 ${this.connectionId} 已关闭`);
      this.connectionId = null;
      return true;
    }

    return false;
  }

  /**
   * 智能检测 SQL 插件的可用方式
   */
  static detectSqlMode(): ClientMode {
    const baseMode = environmentDetector.detectMode();

    // 对于 tauri-proxy 模式，需要进一步检测代理是否可用
    if (baseMode === 'tauri-proxy') {
      if (window.$wujie?.props?.tauriSql) {
        logger.debug('检测到 Wujie 环境，发现主应用 SQL 代理');
        return 'tauri-proxy';
      } else {
        logger.debug('检测到 Wujie 环境，但无 SQL 代理，使用 HTTP 服务');
        return 'http';
      }
    }

    return baseMode;
  }

  /**
   * 获取所有活跃连接 - HTTP 模式专用工具方法
   */
  static async getConnections(baseUrl = 'http://localhost:1421'): Promise<string[]> {
    const response = await fetchWithErrorHandling(`${baseUrl}/sql/connections`);
    const result: ApiResponse<{ connections: string[] }> = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to get connections');
    }

    return result.data!.connections;
  }

  /**
   * 工具函数：获取当前运行环境
   */
  static getEnvironment() {
    return environmentDetector.getEnvironment();
  }
}

// 默认导出
export default Database;
