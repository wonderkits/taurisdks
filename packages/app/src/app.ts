import * as React from 'react';
import { RouteObject } from 'react-router-dom';

// 应用生命周期钩子
export interface AppLifecycleHooks {
  onInstall?: () => Promise<void> | void;
  onActivate?: () => Promise<void> | void;
  onDeactivate?: () => Promise<void> | void;
  onUninstall?: () => Promise<void> | void;
  onUpdate?: (oldVersion: string, newVersion: string) => Promise<void> | void;
}

// 导航项配置
export interface AppNavItem {
  appId: string;        // 应用ID（必填）
  name: string;
  href: string;
  matchPath?: string;
  icon?: React.ElementType;  // 可选：动态应用可能使用HTTP图标
  iconPath?: React.ElementType;
  order?: number;
  visible?: boolean;
  current?: boolean; // 添加current字段以兼容现有的NavItem
}

// 应用权限配置
export interface AppPermission {
  id: string;
  name: string;
  description: string;
  required?: boolean;
}

// 应用路由配置
export interface AppRouteConfig extends Omit<RouteObject, 'children'> {
  meta?: {
    title?: string;
    requireAuth?: boolean;
    permissions?: string[];
    layout?: 'default' | 'fullscreen' | 'minimal';
    // 新增：微前端路由元数据
    isMicroApp?: boolean;
    appId?: string;
  };
  children?: AppRouteConfig[];
}

// 应用依赖配置
export interface AppDependency {
  id: string;
  version: string;
  optional?: boolean;
}

// 应用元数据
export interface AppManifest {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  keywords?: string[];
  category?: string;
  icon?: string;
  screenshots?: string[];
  dependencies?: AppDependency[];
  permissions?: AppPermission[];
  minSystemVersion?: string;
}

// 应用运行模式
export type AppMode = 'wujie' | 'module' | 'auto';

// 应用配置
export interface AppConfig {
  manifest: AppManifest;
  navigation?: AppNavItem;
  routes?: AppRouteConfig[];
  hooks?: AppLifecycleHooks;
  entry?: () => Promise<React.ComponentType>;

  // 新增：Wujie 微前端配置
  wujie?: WujieConfig;
  // 新增：应用运行模式
  mode?: AppMode;
}

// 应用状态
export type AppStatus = 'installed' | 'active' | 'inactive' | 'error' | 'uninstalled';

// 应用实例
export interface AppInstance {
  config: AppConfig;
  status: AppStatus;
  installedAt: Date;
  lastActivatedAt?: Date;
  error?: string;
}

// 应用注册器接口
export interface IAppRegistry {
  register(config: AppConfig): Promise<boolean>;
  unregister(appId: string): Promise<boolean>;
  activate(appId: string): Promise<boolean>;
  deactivate(appId: string): Promise<boolean>;
  getApp(appId: string): AppInstance | undefined;
  getAllApps(): AppInstance[];
  getActiveApps(): AppInstance[];
  isRegistered(appId: string): boolean;
  isActive(appId: string): boolean;
}

// 应用事件类型
export interface AppEvents {
  'app:registered': { app: AppInstance };
  'app:unregistered': { appId: string };
  'app:activated': { app: AppInstance };
  'app:deactivated': { app: AppInstance };
  'app:error': { app: AppInstance; error: string };
}

// 应用上下文
export interface AppContext {
  appId: string;
  registry: IAppRegistry;
  emit: <K extends keyof AppEvents>(event: K, data: AppEvents[K]) => void;
  subscribe: <K extends keyof AppEvents>(
    event: K,
    callback: (data: AppEvents[K]) => void
  ) => () => void;
}

// Wujie 配置类型
export interface WujieConfig {
  name?: string;
  url: string;
  props?: Record<string, any>;
  attrs?: Record<string, any>;
  replace?: boolean;
  sync?: boolean;
  prefix?: {
    'prefix-url'?: string;
    'prefix-class'?: string;
  };
  alive?: boolean;
  sandbox?: boolean;
  fetch?: (url: string, options?: any) => Promise<Response>;
  plugins?: Array<{ htmlLoader?: Function; jsLoader?: Function; cssLoader?: Function }>;
  beforeLoad?: (appWindow: Window) => void;
  beforeMount?: (appWindow: Window) => void;
  afterMount?: (appWindow: Window) => void;
  beforeUnmount?: (appWindow: Window) => void;
  afterUnmount?: (appWindow: Window) => void;
  activated?: () => void;
  deactivated?: () => void;
}
