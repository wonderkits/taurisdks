/**
 * @wonderkits/client React 集成使用示例
 * 
 * 展示如何在 React 应用中使用 WonderKits 客户端
 * 包含自动初始化、状态管理、Hooks 使用等完整示例
 * 
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  // 主要 Hooks
  useWonderKits,
  useWonderKitsClient,
  useWonderKitsConnected,
  useWonderKitsLoading,
  useWonderKitsMode,
  useWonderKitsServices,
  useWonderKitsLogs,
  useWonderKitsSql,
  useWonderKitsStoreClient,
  useWonderKitsFs,
  
  // 初始化函数
  initWonderKits,
  
  // 类型
  type WonderKitsReactConfig,
  WonderKitsProvider
} from '../src/framework/react/index';

/**
 * 1️⃣ 基础使用示例 - 自动初始化组件
 */
const AutoInitializer: React.FC = () => {
  const { isConnected, isLoading, error } = useWonderKits();

  useEffect(() => {
    if (isConnected) return;

    const initialize = async () => {
      try {
        await initWonderKits({
          services: {
            fs: true,
            store: { filename: 'react-demo.json' },
            sql: { connectionString: 'sqlite:react-demo.db' },
            appRegistry: true
          },
          httpPort: 1420,
          verbose: true
        });
        console.log('✅ WonderKits 初始化成功');
      } catch (err) {
        console.error('❌ 初始化失败:', err);
      }
    };

    initialize();
  }, [isConnected]);

  return null; // 纯初始化组件
};

/**
 * 2️⃣ 状态显示组件
 */
const StatusDisplay: React.FC = () => {
  const client = useWonderKitsClient();
  const isConnected = useWonderKitsConnected();
  const isLoading = useWonderKitsLoading();
  const mode = useWonderKitsMode();
  const services = useWonderKitsServices();

  return (
    <div style={{
      padding: '16px',
      margin: '16px 0',
      background: '#f5f5f5',
      borderRadius: '8px',
      borderLeft: `4px solid ${isConnected ? '#10b981' : '#ef4444'}`
    }}>
      <h3 style={{ margin: '0 0 12px 0' }}>📊 WonderKits 状态</h3>
      
      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
        <p><strong>连接状态:</strong> {isConnected ? '✅ 已连接' : '🔴 未连接'}</p>
        <p><strong>加载状态:</strong> {isLoading ? '⏳ 加载中' : '✅ 完成'}</p>
        <p><strong>运行模式:</strong> {mode}</p>
        <p><strong>可用服务:</strong> {services.available.join(', ') || '无'}</p>
        
        {client && (
          <div style={{ marginTop: '8px', fontSize: '12px', opacity: '0.8' }}>
            <span>客户端实例: {client.constructor.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 3️⃣ 服务使用示例组件
 */
const ServiceDemo: React.FC = () => {
  const { sql, isAvailable: sqlAvailable } = useWonderKitsSql();
  const { store, isAvailable: storeAvailable } = useWonderKitsStoreClient();
  const { fs, isAvailable: fsAvailable } = useWonderKitsFs();
  const { addLog } = useWonderKits();

  const testSql = async () => {
    if (!sql) return;
    
    try {
      await sql.execute('CREATE TABLE IF NOT EXISTS demo_users (id INTEGER PRIMARY KEY, name TEXT)');
      await sql.execute('INSERT OR REPLACE INTO demo_users (id, name) VALUES (1, ?)', ['React用户']);
      const result = await sql.select('SELECT * FROM demo_users');
      addLog(`📊 SQL 测试成功，查询到 ${result.data.length} 条记录`);
    } catch (error: any) {
      addLog(`❌ SQL 测试失败: ${error.message}`);
    }
  };

  const testStore = async () => {
    if (!store) return;
    
    try {
      await store.set('demo.timestamp', new Date().toISOString());
      const timestamp = await store.get<string>('demo.timestamp');
      addLog(`💾 Store 测试成功，时间戳: ${timestamp}`);
    } catch (error: any) {
      addLog(`❌ Store 测试失败: ${error.message}`);
    }
  };

  const testFs = async () => {
    if (!fs) return;
    
    try {
      const content = `Hello from React! 时间: ${new Date().toLocaleString()}`;
      await fs.writeTextFile('$HOME/wonderkits-react-demo.txt', content);
      const readContent = await fs.readTextFile('$HOME/wonderkits-react-demo.txt');
      addLog(`📁 FS 测试成功，文件内容: ${readContent.substring(0, 50)}...`);
    } catch (error: any) {
      addLog(`❌ FS 测试失败: ${error.message}`);
    }
  };

  return (
    <div style={{ margin: '16px 0' }}>
      <h3>🧪 服务功能测试</h3>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
        <button 
          onClick={testSql} 
          disabled={!sqlAvailable}
          style={{
            padding: '8px 16px',
            background: sqlAvailable ? '#10b981' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: sqlAvailable ? 'pointer' : 'not-allowed'
          }}
        >
          🗄️ 测试 SQL
        </button>
        
        <button 
          onClick={testStore} 
          disabled={!storeAvailable}
          style={{
            padding: '8px 16px',
            background: storeAvailable ? '#8b5cf6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: storeAvailable ? 'pointer' : 'not-allowed'
          }}
        >
          💾 测试 Store
        </button>
        
        <button 
          onClick={testFs} 
          disabled={!fsAvailable}
          style={{
            padding: '8px 16px',
            background: fsAvailable ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: fsAvailable ? 'pointer' : 'not-allowed'
          }}
        >
          📁 测试 FS
        </button>
      </div>
    </div>
  );
};

/**
 * 4️⃣ 日志显示组件
 */
const LogsDisplay: React.FC = () => {
  const logs = useWonderKitsLogs();
  const { clearLogs } = useWonderKits();

  return (
    <div style={{ margin: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>📝 操作日志</h3>
        <button 
          onClick={clearLogs}
          style={{
            padding: '4px 8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          清空日志
        </button>
      </div>
      
      <div style={{
        background: '#1f2937',
        color: '#f3f4f6',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'Monaco, Consolas, monospace',
        maxHeight: '200px',
        overflowY: 'auto',
        lineHeight: '1.4'
      }}>
        {logs.length === 0 ? (
          <div style={{ opacity: '0.6' }}>暂无日志</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * 5️⃣ 主应用组件
 */
const App: React.FC = () => {
  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🚀 WonderKits React 集成示例</h1>
      
      <p style={{ color: '#666', marginBottom: '24px' }}>
        演示如何在 React 应用中使用 @wonderkits/client/react
      </p>

      {/* 自动初始化 */}
      <AutoInitializer />
      
      {/* 状态显示 */}
      <StatusDisplay />
      
      {/* 服务测试 */}
      <ServiceDemo />
      
      {/* 日志显示 */}
      <LogsDisplay />
      
      <div style={{ 
        marginTop: '32px', 
        padding: '16px', 
        background: '#e0f2fe', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h4>💡 使用提示</h4>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>WonderKits 自动检测运行环境（Tauri/HTTP）</li>
          <li>所有服务支持异步初始化和错误处理</li>
          <li>可以使用 Provider 来创建独立的客户端实例</li>
          <li>支持 TypeScript 类型安全</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * 6️⃣ Provider 使用示例（可选）
 */
const AppWithProvider: React.FC = () => {
  const config: WonderKitsReactConfig = {
    httpPort: 8080,
    verbose: true
  };

  return (
    <WonderKitsProvider 
      config={config}
      autoInit={{
        services: {
          fs: true,
          store: { filename: 'provider-demo.json' },
          sql: { connectionString: 'sqlite:provider-demo.db' },
          appRegistry: true
        }
      }}
    >
      <App />
    </WonderKitsProvider>
  );
};

/**
 * 7️⃣ 应用启动
 */
const startApp = () => {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('未找到 #app 容器');
  }

  const root = createRoot(container);
  
  // 选择使用哪种模式
  const useProvider = false;
  
  if (useProvider) {
    root.render(<AppWithProvider />);
  } else {
    root.render(<App />);
  }
};

// 导出供测试使用
export {
  AutoInitializer,
  StatusDisplay,
  ServiceDemo,
  LogsDisplay,
  App,
  AppWithProvider,
  startApp
};

// 如果直接运行此文件
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', startApp);
}