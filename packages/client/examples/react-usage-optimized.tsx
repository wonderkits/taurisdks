/**
 * WonderKits React 使用示例 - 重构后
 * 
 * 展示简化后的API使用方式
 */

import React, { useEffect } from 'react';
import { 
  initWonderKits, 
  useWonderKits, 
  useActiveApps,
  useSystemOverview,
  type WonderKitsReactConfig 
} from '@wonderkits/client/react';

// 🎯 简化的配置 - 更直观的结构
const wonderkitsConfig: WonderKitsReactConfig = {
  // 服务配置 - 结构化配置
  services: {
    fs: true,
    store: { filename: 'my-app.json' },
    sql: { connectionString: 'sqlite:my-app.db' },
    appRegistry: true
  },
  // 客户端配置
  httpPort: 1420,
  verbose: true
};

// 🚀 应用初始化组件
function AppInitializer() {
  const { isConnected, isLoading, error } = useWonderKits();

  useEffect(() => {
    // 异步初始化 - 无需复杂的生命周期管理
    const initialize = async () => {
      try {
        await initWonderKits(wonderkitsConfig);
        console.log('✅ WonderKits 初始化成功');
      } catch (err) {
        console.error('❌ 初始化失败:', err);
      }
    };

    initialize();
  }, []);

  if (isLoading) return <div>正在初始化 WonderKits...</div>;
  if (error) return <div>初始化错误: {error}</div>;
  if (!isConnected) return <div>等待连接...</div>;

  return <AppContent />;
}

// 📱 应用内容组件 - 使用各种hooks
function AppContent() {
  const activeApps = useActiveApps();
  const systemOverview = useSystemOverview();

  return (
    <div>
      <h1>WonderKits 应用管理</h1>
      
      {/* 系统状态 */}
      <SystemStatus {...systemOverview} />
      
      {/* 活跃应用列表 */}
      <ActiveAppsList {...activeApps} />
    </div>
  );
}

// 📊 系统状态组件
function SystemStatus({ 
  systemStatus, 
  appStats, 
  systemLoading, 
  statsLoading 
}: ReturnType<typeof useSystemOverview>) {
  if (systemLoading || statsLoading) {
    return <div>加载系统状态...</div>;
  }

  return (
    <div className="system-status">
      <h2>系统状态</h2>
      <div>
        <span>状态: {systemStatus?.status}</span>
        <span>运行时间: {systemStatus?.uptime}ms</span>
      </div>
      <div>
        <span>总应用: {appStats?.total}</span>
        <span>活跃: {appStats?.active}</span>
        <span>非活跃: {appStats?.inactive}</span>
      </div>
    </div>
  );
}

// 📦 活跃应用列表组件
function ActiveAppsList({ 
  apps, 
  loading, 
  error, 
  refresh 
}: ReturnType<typeof useActiveApps>) {
  if (loading) return <div>加载应用列表...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div className="active-apps">
      <div className="header">
        <h2>活跃应用 ({apps.length})</h2>
        <button onClick={refresh}>刷新</button>
      </div>
      <div className="app-list">
        {apps.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

// 🎴 应用卡片组件
function AppCard({ app }: { app: any }) {
  return (
    <div className="app-card">
      <h3>{app.name}</h3>
      <p>ID: {app.id}</p>
      <p>状态: {app.status}</p>
      <p>版本: {app.version}</p>
    </div>
  );
}

// 🎨 样式 (实际项目中应该在CSS文件中)
const styles = `
  .system-status {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .system-status div {
    display: flex;
    gap: 20px;
    margin: 8px 0;
  }
  
  .active-apps .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .app-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }
  
  .app-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    background: white;
  }
  
  .app-card h3 {
    margin: 0 0 8px 0;
    color: #333;
  }
  
  .app-card p {
    margin: 4px 0;
    color: #666;
    font-size: 14px;
  }
`;

// 💡 主应用组件
export default function App() {
  return (
    <div>
      <style>{styles}</style>
      <AppInitializer />
    </div>
  );
}

/**
 * 🎯 重构前后对比
 * 
 * 重构前需要：
 * ❌ 复杂的配置对象 (enableFs, enableStore, enableSql, storeFilename, sqlConnectionString)
 * ❌ 手动管理初始化状态
 * ❌ 重复的错误处理逻辑
 * ❌ 独立的AppRegistry实例管理
 * 
 * 重构后：
 * ✅ 结构化的services配置
 * ✅ 统一的初始化流程
 * ✅ 自动的错误处理和状态管理
 * ✅ 统一的客户端访问
 * ✅ 更简洁的API使用
 */

/**
 * 📋 配置选项说明
 * 
 * services: {
 *   fs: boolean,                                    // 简单开关
 *   store: boolean | { filename?: string },        // 支持配置
 *   sql: boolean | { connectionString?: string },  // 支持配置
 *   appRegistry: boolean                            // 简单开关
 * }
 * 
 * 默认值：
 * - 所有服务默认启用 (undefined = true)
 * - store.filename = 'app-settings.json'
 * - sql.connectionString = 'sqlite:app.db'
 */