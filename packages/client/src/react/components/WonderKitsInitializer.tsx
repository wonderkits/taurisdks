/**
 * WonderKits 自动初始化组件
 * 
 * 负责在应用启动时自动初始化 WonderKits 服务
 * 支持通过 props 传递服务配置，提供灵活的配置选项
 */

import { useEffect } from 'react';
import { useWonderKits } from '../hooks';

export interface WonderKitsInitializerProps {
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
  
  /** 初始化成功回调 */
  onInitialized?: () => void;
  /** 初始化失败回调 */
  onError?: (error: Error) => void;
  
  /** 是否显示日志信息 */
  showLogs?: boolean;
  /** 自定义日志前缀 */
  logPrefix?: string;
}

const WonderKitsInitializer: React.FC<WonderKitsInitializerProps> = ({
  enableFs = true,
  enableStore = true,
  enableSql = true,
  storeFilename = 'app-settings.json',
  sqlConnectionString = 'sqlite:app.db',
  onInitialized,
  onError,
  showLogs = true,
  logPrefix = '🚀'
}) => {
  const { initWithServices, addLog, isConnected } = useWonderKits();

  useEffect(() => {
    // 如果已经连接，跳过初始化
    if (isConnected) {
      return;
    }

    const initializeServices = async () => {
      try {
        if (showLogs) {
          addLog(`${logPrefix} 应用启动，正在初始化 WonderKits 客户端...`);
        }
        
        // 初始化指定的服务
        await initWithServices({
          enableFs,
          enableStore,
          enableSql,
          storeFilename,
          sqlConnectionString
        });
        
        if (showLogs) {
          addLog(`✅ WonderKits 客户端初始化完成，所有服务已就绪`);
        }
        
        // 调用成功回调
        onInitialized?.();
      } catch (error: any) {
        console.error('WonderKits 初始化失败:', error);
        
        if (showLogs) {
          addLog(`❌ 初始化失败: ${error.message}`);
        }
        
        // 调用错误回调
        onError?.(error);
      }
    };

    // 稍微延迟以确保组件已挂载
    setTimeout(initializeServices, 100);
  }, [
    initWithServices, 
    addLog, 
    isConnected, 
    enableFs, 
    enableStore, 
    enableSql, 
    storeFilename, 
    sqlConnectionString, 
    onInitialized, 
    onError, 
    showLogs, 
    logPrefix
  ]);

  // 这个组件不渲染任何内容
  return null;
};

export default WonderKitsInitializer;