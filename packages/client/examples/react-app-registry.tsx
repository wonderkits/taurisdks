/**
 * React App Registry 示例组件
 * 
 * 展示如何在 React 应用中使用 App Registry 相关的 hooks
 */

import React, { useState } from 'react';
import {
  useApps,
  useActiveApps,
  useSystemOverview,
  useAppRegistration,
  useAppSearch,
  useAppManager,
  AppConfig
} from '../src/framework/react';

// ============================================================================
// 应用列表组件
// ============================================================================

interface AppListProps {
  title: string;
  filter?: { status?: string; category?: string };
  showActions?: boolean;
}

const AppList: React.FC<AppListProps> = ({ title, filter, showActions = true }) => {
  const { apps, loading, error, refresh, bulkActivate, bulkDeactivate } = useApps({
    status: filter?.status,
    category: filter?.category,
    autoRefresh: true
  });

  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  const handleSelectApp = (appId: string, checked: boolean) => {
    setSelectedApps(prev => 
      checked 
        ? [...prev, appId]
        : prev.filter(id => id !== appId)
    );
  };

  const handleBulkActivate = async () => {
    try {
      const result = await bulkActivate(selectedApps);
      console.log('批量激活结果:', result);
      setSelectedApps([]);
    } catch (error) {
      console.error('批量激活失败:', error);
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      const result = await bulkDeactivate(selectedApps);
      console.log('批量停用结果:', result);
      setSelectedApps([]);
    } catch (error) {
      console.error('批量停用失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="app-list">
        <h3>{title}</h3>
        <p>正在加载...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-list error">
        <h3>{title}</h3>
        <p>错误: {error}</p>
        <button onClick={refresh}>重试</button>
      </div>
    );
  }

  return (
    <div className="app-list">
      <div className="app-list-header">
        <h3>{title} ({apps.length})</h3>
        <div className="app-list-actions">
          <button onClick={refresh}>🔄 刷新</button>
          {showActions && selectedApps.length > 0 && (
            <>
              <button onClick={handleBulkActivate}>
                ✅ 批量激活 ({selectedApps.length})
              </button>
              <button onClick={handleBulkDeactivate}>
                ⏹️ 批量停用 ({selectedApps.length})
              </button>
            </>
          )}
        </div>
      </div>

      {apps.length === 0 ? (
        <p>暂无应用</p>
      ) : (
        <div className="app-grid">
          {apps.map(app => (
            <AppCard
              key={app.id}
              app={app}
              selectable={showActions}
              selected={selectedApps.includes(app.id)}
              onSelect={(checked) => handleSelectApp(app.id, checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 应用卡片组件
// ============================================================================

interface AppCardProps {
  app: import('../src/plugin/app-registry').RegisteredApp;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, selectable, selected, onSelect }) => {
  const { activate, deactivate, uninstall } = useAppManager(app.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#9E9E9E';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const handleActivate = async () => {
    try {
      await activate();
      console.log(`应用 ${app.display_name} 激活成功`);
    } catch (error) {
      console.error('激活失败:', error);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivate();
      console.log(`应用 ${app.display_name} 停用成功`);
    } catch (error) {
      console.error('停用失败:', error);
    }
  };

  const handleUninstall = async () => {
    if (window.confirm(`确定要卸载应用 ${app.display_name} 吗？`)) {
      try {
        await uninstall();
        console.log(`应用 ${app.display_name} 卸载成功`);
      } catch (error) {
        console.error('卸载失败:', error);
      }
    }
  };

  return (
    <div className="app-card" data-status={app.status}>
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect?.(e.target.checked)}
          className="app-select"
        />
      )}

      <div className="app-header">
        <h4>{app.display_name}</h4>
        <span 
          className="app-status"
          style={{ backgroundColor: getStatusColor(app.status) }}
        >
          {app.status}
        </span>
      </div>

      <div className="app-details">
        <p><strong>ID:</strong> {app.id}</p>
        <p><strong>版本:</strong> {app.version}</p>
        {app.description && (
          <p><strong>描述:</strong> {app.description}</p>
        )}
        {app.category && (
          <p><strong>分类:</strong> {app.category}</p>
        )}
        {app.author && (
          <p><strong>作者:</strong> {app.author}</p>
        )}
        {app.dev_url && (
          <p><strong>开发URL:</strong> 
            <a href={app.dev_url} target="_blank" rel="noopener noreferrer">
              {app.dev_url}
            </a>
          </p>
        )}
      </div>

      <div className="app-actions">
        {app.status === 'active' ? (
          <button onClick={handleDeactivate} className="btn-deactivate">
            ⏹️ 停用
          </button>
        ) : (
          <button onClick={handleActivate} className="btn-activate">
            ▶️ 激活
          </button>
        )}
        <button onClick={handleUninstall} className="btn-uninstall">
          🗑️ 卸载
        </button>
      </div>

      {app.error_message && (
        <div className="app-error">
          <p><strong>错误:</strong> {app.error_message}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 系统总览组件
// ============================================================================

const SystemOverview: React.FC = () => {
  const {
    systemStatus,
    systemLoading,
    systemError,
    appStats,
    statsLoading,
    statsError,
    activeApps
  } = useSystemOverview();

  if (systemLoading || statsLoading) {
    return <div>正在加载系统状态...</div>;
  }

  if (systemError || statsError) {
    return (
      <div className="system-overview error">
        <h2>系统总览</h2>
        <p>加载失败: {systemError || statsError}</p>
      </div>
    );
  }

  return (
    <div className="system-overview">
      <h2>系统总览</h2>
      
      {/* 系统状态 */}
      {systemStatus && (
        <div className="system-status">
          <h3>系统状态</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">总应用数:</span>
              <span className="value">{systemStatus.total_apps}</span>
            </div>
            <div className="status-item">
              <span className="label">活跃应用:</span>
              <span className="value">{systemStatus.active_apps}</span>
            </div>
            <div className="status-item">
              <span className="label">非活跃应用:</span>
              <span className="value">{systemStatus.inactive_apps}</span>
            </div>
            <div className="status-item">
              <span className="label">错误应用:</span>
              <span className="value">{systemStatus.error_apps}</span>
            </div>
            <div className="status-item">
              <span className="label">系统版本:</span>
              <span className="value">{systemStatus.system_version}</span>
            </div>
            <div className="status-item">
              <span className="label">运行时间:</span>
              <span className="value">{Math.floor(systemStatus.uptime / 60)} 分钟</span>
            </div>
          </div>
        </div>
      )}

      {/* 应用统计 */}
      {appStats && (
        <div className="app-stats">
          <h3>应用统计</h3>
          
          <div className="stats-section">
            <h4>按状态分布</h4>
            <div className="stats-grid">
              {Object.entries(appStats.by_status).map(([status, count]) => (
                <div key={status} className="stats-item">
                  <span className="label">{status}:</span>
                  <span className="value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-section">
            <h4>按分类分布</h4>
            <div className="stats-grid">
              {Object.entries(appStats.by_category).map(([category, count]) => (
                <div key={category} className="stats-item">
                  <span className="label">{category}:</span>
                  <span className="value">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 活跃应用摘要 */}
      <div className="active-apps-summary">
        <h3>活跃应用 ({activeApps.length})</h3>
        {activeApps.length > 0 ? (
          <ul>
            {activeApps.slice(0, 5).map(app => (
              <li key={app.id}>
                {app.display_name} (v{app.version})
              </li>
            ))}
            {activeApps.length > 5 && (
              <li>... 还有 {activeApps.length - 5} 个应用</li>
            )}
          </ul>
        ) : (
          <p>暂无活跃应用</p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 应用注册组件
// ============================================================================

const AppRegistrationForm: React.FC = () => {
  const { registerApp, devRegisterApp, registering, error } = useAppRegistration();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    displayName: '',
    version: '1.0.0',
    description: '',
    author: '',
    category: '',
    devUrl: ''
  });
  const [isDev, setIsDev] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const config: AppConfig = {
      manifest: {
        id: formData.id,
        name: formData.name,
        displayName: formData.displayName,
        version: formData.version,
        description: formData.description || undefined,
        author: formData.author || undefined,
        category: formData.category || undefined
      }
    };

    try {
      if (isDev && formData.devUrl) {
        const result = await devRegisterApp(config, formData.devUrl);
        alert(`开发应用${result.action === 'created' ? '创建' : '更新'}成功: ${result.app_id}`);
      } else {
        const appId = await registerApp(config);
        alert(`应用注册成功: ${appId}`);
      }
      
      // 重置表单
      setFormData({
        id: '',
        name: '',
        displayName: '',
        version: '1.0.0',
        description: '',
        author: '',
        category: '',
        devUrl: ''
      });
    } catch (err) {
      console.error('注册失败:', err);
    }
  };

  return (
    <div className="app-registration-form">
      <h2>应用注册</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isDev}
              onChange={(e) => setIsDev(e.target.checked)}
            />
            开发模式
          </label>
        </div>

        <div className="form-group">
          <label>应用ID (必填):</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
            required
            pattern="[a-zA-Z][a-zA-Z0-9_-]*"
            title="应用ID必须以字母开头，只能包含字母、数字、下划线和连字符"
          />
        </div>

        <div className="form-group">
          <label>应用名称 (必填):</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>显示名称 (必填):</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>版本号:</label>
          <input
            type="text"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            pattern="\d+\.\d+\.\d+(-.*)?$"
            title="版本号格式: x.y.z 或 x.y.z-suffix"
          />
        </div>

        <div className="form-group">
          <label>描述:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>作者:</label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>分类:</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">选择分类</option>
            <option value="tools">工具</option>
            <option value="games">游戏</option>
            <option value="productivity">效率</option>
            <option value="entertainment">娱乐</option>
            <option value="education">教育</option>
            <option value="business">商务</option>
            <option value="other">其他</option>
          </select>
        </div>

        {isDev && (
          <div className="form-group">
            <label>开发URL (开发模式必填):</label>
            <input
              type="url"
              value={formData.devUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, devUrl: e.target.value }))}
              required={isDev}
              placeholder="http://localhost:3001"
            />
          </div>
        )}

        {error && (
          <div className="form-error">
            错误: {error}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={registering}>
            {registering ? '正在注册...' : (isDev ? '注册/更新开发应用' : '注册应用')}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// 应用搜索组件
// ============================================================================

const AppSearchComponent: React.FC = () => {
  const { results, loading, error, search, clearResults } = useAppSearch();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    author: ''
  });

  const handleSearch = async () => {
    if (!query.trim() && !filters.status && !filters.category && !filters.author) {
      alert('请输入搜索关键字或选择过滤条件');
      return;
    }

    await search(query, {
      status: filters.status || undefined,
      category: filters.category || undefined,
      author: filters.author || undefined
    });
  };

  const handleClear = () => {
    setQuery('');
    setFilters({ status: '', category: '', author: '' });
    clearResults();
  };

  return (
    <div className="app-search">
      <h2>应用搜索</h2>

      <div className="search-form">
        <div className="search-input">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索应用名称、描述..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '搜索中...' : '🔍 搜索'}
          </button>
        </div>

        <div className="search-filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
            <option value="error">错误</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">全部分类</option>
            <option value="tools">工具</option>
            <option value="games">游戏</option>
            <option value="productivity">效率</option>
            <option value="entertainment">娱乐</option>
            <option value="education">教育</option>
            <option value="business">商务</option>
            <option value="other">其他</option>
          </select>

          <input
            type="text"
            value={filters.author}
            onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
            placeholder="按作者过滤"
          />

          <button onClick={handleClear}>清除</button>
        </div>
      </div>

      {error && (
        <div className="search-error">
          搜索错误: {error}
        </div>
      )}

      <div className="search-results">
        {results.length > 0 ? (
          <>
            <p>找到 {results.length} 个应用</p>
            <div className="app-grid">
              {results.map(app => (
                <AppCard key={app.id} app={app} selectable={false} />
              ))}
            </div>
          </>
        ) : (
          !loading && <p>暂无搜索结果</p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 主应用组件
// ============================================================================

const AppRegistryDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '系统总览' },
    { id: 'apps', label: '所有应用' },
    { id: 'active', label: '活跃应用' },
    { id: 'register', label: '应用注册' },
    { id: 'search', label: '应用搜索' }
  ];

  return (
    <div className="app-registry-demo">
      <header className="demo-header">
        <h1>App Registry 管理界面</h1>
        <nav className="demo-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="demo-content">
        {activeTab === 'overview' && <SystemOverview />}
        
        {activeTab === 'apps' && (
          <AppList title="所有应用" showActions={true} />
        )}
        
        {activeTab === 'active' && (
          <AppList 
            title="活跃应用" 
            filter={{ status: 'active' }} 
            showActions={true} 
          />
        )}
        
        {activeTab === 'register' && <AppRegistrationForm />}
        
        {activeTab === 'search' && <AppSearchComponent />}
      </main>
    </div>
  );
};

export default AppRegistryDemo;