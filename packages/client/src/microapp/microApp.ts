/**
 * 微前端相关类型定义
 */

import { AppConfig } from './app';

// 微前端路由信息
export interface MicroAppRouteInfo {
  appId: string;
  currentPath: string;      // 主应用当前完整路径
  subAppPath: string;       // 子应用内部路径
  basePath: string;         // 应用基础路径
  query?: Record<string, string>;
  hash?: string;
}

// 子应用通信事件类型
export interface SubAppEvents {
  'sub-route-change': {
    appId: string;
    path: string;
    timestamp: number;
  };
  'sub-app-ready': {
    appId: string;
    version: string;
  };
  'sub-app-error': {
    appId: string;
    error: string;
    timestamp: number;
  };
  'sub-app-message': {
    appId: string;
    type: string;
    data: any;
  };
}

// 主应用向子应用发送的事件类型
export interface ParentAppEvents {
  'parent-route-change': {
    path: string;
    timestamp: number;
  };
  'parent-app-message': {
    type: string;
    data: any;
  };
  'app-config-update': {
    appId: string;
    config: Partial<AppConfig>;
  };
}

// Wujie 扩展配置
export interface WujieExtendedConfig {
  // 路由同步配置
  routeSync?: {
    enabled: boolean;
    syncMode: 'auto' | 'manual';
    pathPrefix?: string;
  };
  
  // 生命周期增强
  lifecycle?: {
    beforeMount?: (appId: string) => Promise<void> | void;
    afterMount?: (appId: string) => Promise<void> | void;
    beforeUnmount?: (appId: string) => Promise<void> | void;
    afterUnmount?: (appId: string) => Promise<void> | void;
  };

  // 错误处理
  errorHandling?: {
    onError?: (error: Error, appId: string) => void;
    fallbackComponent?: React.ComponentType<{ error: Error; appId: string }>;
  };

  // 性能监控
  performance?: {
    enableMonitoring: boolean;
    onMetrics?: (metrics: MicroAppMetrics) => void;
  };
}

// 微前端性能指标
export interface MicroAppMetrics {
  appId: string;
  loadTime: number;
  mountTime: number;
  firstContentfulPaint?: number;
  firstMeaningfulPaint?: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
}

// 微前端应用状态
export interface MicroAppState {
  appId: string;
  status: 'loading' | 'loaded' | 'mounting' | 'mounted' | 'unmounting' | 'error';
  error?: string;
  routeInfo?: MicroAppRouteInfo;
  metrics?: MicroAppMetrics;
  lastActiveTime?: number;
}

// 微前端容器属性
export interface MicroAppContainerProps {
  config: AppConfig;
  routeInfo?: MicroAppRouteInfo;
  onStateChange?: (state: MicroAppState) => void;
  onRouteChange?: (routeInfo: MicroAppRouteInfo) => void;
  onError?: (error: Error) => void;
  onMetrics?: (metrics: MicroAppMetrics) => void;
}

// 子应用工具函数返回类型
export interface SubAppUtils {
  isInWujie: boolean;
  props?: any;
  appInfo: {
    appId?: string;
    parentName?: string;
    currentPath?: string;
    subAppPath?: string;
  };
  communication: {
    emitToParent: (eventName: string, data?: any) => void;
    listenFromParent: (eventName: string, callback: (data?: any) => void) => () => void;
  };
  routing: {
    notifyRouteChange: (newPath: string) => void;
    listenParentRouteChange: (callback: (path: string) => void) => () => void;
  };
}

// 动态路由匹配结果
export interface RouteMatchResult {
  matched: boolean;
  appId?: string;
  appConfig?: AppConfig;
  routeInfo?: MicroAppRouteInfo;
  exactMatch: boolean;
  score: number; // 匹配度评分
}

// 路由匹配器配置
export interface RouteMatcherConfig {
  strictMode: boolean;        // 严格模式匹配
  caseSensitive: boolean;     // 大小写敏感
  trailingSlash: boolean;     // 是否要求尾部斜杠
  priority: 'order' | 'specificity'; // 优先级策略
}