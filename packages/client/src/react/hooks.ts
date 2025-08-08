/**
 * WonderKits React Hooks - 简化版
 *
 * 提供简洁的 React Hooks 来使用 WonderKits 客户端
 *
 * @version 1.1.0
 * @license MIT
 */

import { useWonderKitsStore } from './store';
import type { WonderKitsClientConfig, ClientServices } from '../client';
import { WujieUtils } from '../wujie';

/**
 * 主要的 WonderKits Hook - 获取完整状态和操作
 */
export const useWonderKits = () => {
  return useWonderKitsStore();
};

/**
 * 初始化配置接口
 */
export interface WonderKitsInitConfig {
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

  /** HTTP 服务端口（独立运行时） */
  httpPort?: number;
  /** 是否强制指定运行模式 */
  forceMode?: 'tauri-native' | 'tauri-proxy' | 'http';
  /** 是否显示详细日志 */
  verbose?: boolean;
}

/**
 * 函数式初始化 - 不依赖组件生命周期
 */
export const initWonderKits = async (config: WonderKitsInitConfig = {}) => {
  const {
    enableFs = true,
    enableStore = true,
    enableSql = true,
    storeFilename = 'app-settings.json',
    sqlConnectionString = 'sqlite:app.db',
    httpPort = 8080,
    forceMode,
    verbose = true,
  } = config;

  const store = useWonderKitsStore.getState();

  // Wujie 环境检测和配置
  const isInWujie = WujieUtils.isInWujie();
  const appInfo = WujieUtils.getAppInfo();

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
    forceMode,
    verbose,
  };

  if (verbose) {
    store.addLog('🚀 初始化 WonderKits 客户端...');
    store.addLog(`🔧 服务: SQL=${enableSql}, Store=${enableStore}, FS=${enableFs}`);
    store.addLog(`🌐 HTTP端口: ${httpPort}, 模式: ${forceMode || '自动检测'}`);
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
