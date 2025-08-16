/**
 * 通用类型定义
 * @magicteam/client
 */

// 运行模式类型
export type ClientMode = 'tauri-native' | 'tauri-proxy' | 'http';

// 运行环境类型
export type RuntimeEnvironment = 'tauri' | 'node' | 'browser';

// 基础选项接口
export interface BaseClientOptions {
  httpBaseUrl?: string;
}

// Wujie 环境检测
export interface WujieGlobal {
  __POWERED_BY_WUJIE__?: boolean;
  $wujie?: {
    props?: {
      tauriSql?: any;
      tauriStore?: any;
      tauriFs?: any;
    };
  };
}

// Tauri 环境检测
export interface TauriGlobal {
  __TAURI__?: any;
}

// 全局窗口接口
declare global {
  interface Window extends WujieGlobal, TauriGlobal {}
}

// 环境检测工具类型
export interface EnvironmentDetector {
  detectMode(): ClientMode;
  getEnvironment(): RuntimeEnvironment;
  isInWujie(): boolean;
  isInTauri(): boolean;
}

// 通用客户端接口
export interface BaseClient {
  readonly isHttpMode: boolean;
  readonly isProxyMode: boolean;
  readonly isTauriNative: boolean;
}

// 错误类型
export class ClientError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ClientError';
  }
}

// HTTP响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}