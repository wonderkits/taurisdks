# App Registry 客户端使用指南

## 概述

App Registry 客户端提供了与 Tauri 应用注册中心交互的完整解决方案，采用与现有 Plugin 系统一致的多模式统一接口设计。

## 核心特性

### 🏗️ 统一架构设计
- 参考 `TauriSqlProxy`、`TauriStoreProxy` 等的设计模式
- 提供连接管理、类型安全、错误处理等统一功能
- 支持全局单例模式和实例化模式

### 📱 完整的应用生命周期管理
- 应用注册/注销
- 应用激活/停用/卸载
- 开发环境热更新
- 批量操作支持

### 📊 监控和统计
- 应用健康状态检查
- 系统状态监控
- 应用统计信息
- 事件历史追踪

### 🔍 搜索和过滤
- 文本搜索功能
- 状态/分类/作者过滤
- 高级查询支持

### ⚛️ React 集成
- 丰富的 React Hooks
- 自动刷新和状态管理
- 类型安全的组件接口

## 安装和导入

```typescript
// 统一导入 - 所有功能都从主入口导入
import { 
  AppRegistryClient,
  useApp, 
  useApps, 
  useAppRegistration,
  useSystemOverview,
  type AppConfig, 
  type RegisteredApp, 
  type AppHealthStatus 
} from '@wonderkits/client';
```

## 基础使用

### 1. 客户端初始化

```typescript
import { AppRegistryClient } from '@wonderkits/client';

// 创建客户端实例（智能模式选择）
const appRegistryClient = await AppRegistryClient.create();

// 检查客户端就绪状态
console.log('客户端就绪状态:', appRegistryClient.isReady());
```

### 2. 应用基本操作

```typescript
// 获取所有应用
const apps = await appRegistryClient.getApps();

// 获取特定应用
const app = await appRegistryClient.getApp('app-id');

// 激活应用
await appRegistryClient.activateApp('app-id');

// 停用应用
await appRegistryClient.deactivateApp('app-id');

// 卸载应用
await appRegistryClient.uninstallApp('app-id');
```

### 3. 应用注册

```typescript
const appConfig: AppConfig = {
  manifest: {
    id: 'my-app',
    name: 'my-app',
    displayName: '我的应用',
    version: '1.0.0',
    description: '这是一个示例应用',
    author: '开发者',
    category: 'tools'
  },
  navigation: {
    name: '我的应用',
    href: '/my-app',
    order: 10
  }
};

// 正式注册
const appId = await appRegistryClient.registerApp(appConfig);

// 开发环境注册（支持热更新）
const result = await appRegistryClient.devRegisterApp(
  appConfig, 
  'http://localhost:3001'
);
```

### 4. 批量操作

```typescript
const appIds = ['app1', 'app2', 'app3'];

// 批量激活
const activateResult = await appRegistryClient.bulkActivateApps(appIds);
console.log('激活成功:', activateResult.successful);
console.log('激活失败:', activateResult.failed);

// 批量停用
const deactivateResult = await appRegistryClient.bulkDeactivateApps(appIds);

// 批量卸载
const uninstallResult = await appRegistryClient.bulkUninstallApps(appIds);
```

## 监控和统计

### 1. 应用健康检查

```typescript
// 检查单个应用健康状态
const health = await appRegistryClient.getAppHealth('app-id');
console.log('健康状态:', health.status);
console.log('响应时间:', health.response_time);

// 系统级健康检查
const systemHealth = await appRegistryClient.healthCheck();
console.log('系统健康:', systemHealth.healthy);
```

### 2. 系统状态和统计

```typescript
// 获取系统状态
const systemStatus = await appRegistryClient.getSystemStatus();
console.log('总应用数:', systemStatus.total_apps);
console.log('活跃应用数:', systemStatus.active_apps);
console.log('系统运行时间:', systemStatus.uptime);

// 获取应用统计
const appStats = await appRegistryClient.getAppStats();
console.log('按状态分布:', appStats.by_status);
console.log('按分类分布:', appStats.by_category);
```

### 3. 事件监控

```typescript
// 获取应用事件历史
const events = await appRegistryClient.getAppEvents('app-id', 10);
events.forEach(event => {
  console.log(`${event.created_at}: ${event.event_type}`);
});
```

## 搜索和过滤

```typescript
// 文本搜索
const searchResults = await appRegistryClient.searchApps('游戏');

// 带过滤器的搜索
const filteredResults = await appRegistryClient.searchApps('', {
  status: 'active',
  category: 'tools',
  author: '开发者'
});

// 按状态获取应用
const activeApps = await appRegistryClient.getAppsByStatus('active');

// 按分类获取应用
const toolsApps = await appRegistryClient.getAppsByCategory('tools');
```

## React Hooks 使用

### 1. 应用列表管理

```tsx
import { useApps, useActiveApps } from '@wonderkits/client';

function AppListComponent() {
  const { 
    apps, 
    loading, 
    error, 
    refresh,
    bulkActivate,
    bulkDeactivate 
  } = useApps({
    status: 'inactive',
    autoRefresh: true,
    refreshInterval: 30000
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h2>应用列表 ({apps.length})</h2>
      <button onClick={refresh}>刷新</button>
      
      {apps.map(app => (
        <div key={app.id}>
          <h3>{app.display_name}</h3>
          <p>状态: {app.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. 单个应用管理

```tsx
import { useApp } from '@wonderkits/client';

function AppDetailComponent({ appId }: { appId: string }) {
  const { 
    app, 
    loading, 
    error, 
    activate, 
    deactivate, 
    uninstall 
  } = useApp(appId);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!app) return <div>应用不存在</div>;

  return (
    <div>
      <h2>{app.display_name}</h2>
      <p>版本: {app.version}</p>
      <p>状态: {app.status}</p>
      
      <div>
        {app.status === 'active' ? (
          <button onClick={deactivate}>停用</button>
        ) : (
          <button onClick={activate}>激活</button>
        )}
        <button onClick={uninstall}>卸载</button>
      </div>
    </div>
  );
}
```

### 3. 应用注册表单

```tsx
import { useAppRegistration } from '@wonderkits/client';

function AppRegistrationForm() {
  const { registerApp, registering, error } = useAppRegistration();
  
  const handleSubmit = async (formData: AppConfig) => {
    try {
      const appId = await registerApp(formData);
      alert(`应用注册成功: ${appId}`);
    } catch (err) {
      console.error('注册失败:', err);
    }
  };

  return (
    <form onSubmit={/* ... */}>
      {/* 表单字段 */}
      <button type="submit" disabled={registering}>
        {registering ? '注册中...' : '注册应用'}
      </button>
      {error && <p style={{ color: 'red' }}>错误: {error}</p>}
    </form>
  );
}
```

### 4. 系统监控面板

```tsx
import { useSystemOverview } from '@wonderkits/client';

function SystemDashboard() {
  const {
    systemStatus,
    systemLoading,
    appStats,
    statsLoading,
    activeApps,
    refreshSystem
  } = useSystemOverview();

  return (
    <div>
      <h1>系统总览</h1>
      
      {systemLoading ? (
        <div>加载系统状态...</div>
      ) : systemStatus ? (
        <div>
          <h2>系统状态</h2>
          <p>总应用数: {systemStatus.total_apps}</p>
          <p>活跃应用: {systemStatus.active_apps}</p>
          <p>运行时间: {Math.floor(systemStatus.uptime / 60)} 分钟</p>
        </div>
      ) : null}

      {statsLoading ? (
        <div>加载统计信息...</div>
      ) : appStats ? (
        <div>
          <h2>应用统计</h2>
          <h3>按状态分布</h3>
          {Object.entries(appStats.by_status).map(([status, count]) => (
            <p key={status}>{status}: {count}</p>
          ))}
        </div>
      ) : null}

      <div>
        <h2>活跃应用 ({activeApps.length})</h2>
        {activeApps.map(app => (
          <p key={app.id}>{app.display_name} (v{app.version})</p>
        ))}
      </div>

      <button onClick={refreshSystem}>刷新</button>
    </div>
  );
}
```

## 高级功能

### 1. 状态等待

```typescript
// 等待应用达到指定状态
const success = await appRegistryClient.waitForAppStatus(
  'app-id', 
  'active', 
  30000 // 30秒超时
);

console.log('状态变化结果:', success ? '成功' : '超时');
```

### 2. 工具函数

```typescript
// 检查应用是否存在
const exists = await appRegistryClient.appExists('app-id');

// 检查应用是否活跃
const isActive = await appRegistryClient.isAppActive('app-id');

// 配置验证
const validation = await appRegistryClient.validateAppConfig(appConfig);
if (!validation.valid) {
  console.error('配置错误:', validation.errors);
}
```

### 3. 缓存管理

```typescript
// 清理所有应用缓存
await appRegistryClient.cleanupAppCache();

// 清理特定应用缓存
await appRegistryClient.cleanupAppCache('app-id');
```

## 错误处理

```typescript
try {
  const app = await appRegistryClient.getApp('non-existent-app');
} catch (error) {
  if (error.message.includes('应用不存在')) {
    console.log('应用未找到');
  } else {
    console.error('其他错误:', error);
  }
}
```

## 最佳实践

### 1. 连接管理
- 使用 `AppRegistryClient.create()` 创建客户端实例，支持智能模式选择
- 客户端自动处理连接状态，无需手动管理
- 支持 Tauri 原生、主应用代理、HTTP 服务三种模式

### 2. 错误处理
- 始终包装异步调用在 try-catch 中
- 使用 React Hooks 时，错误状态会自动管理

### 3. 性能优化
- 使用 `autoRefresh` 功能进行实时数据更新
- 批量操作优于单个操作
- 合理设置刷新间隔

### 4. 类型安全
- 使用 TypeScript 获得完整的类型支持
- 导入需要的类型定义

## 示例项目

完整的示例代码可在以下文件中找到：

- 基础使用: `examples/app-registry-integration.ts`
- React 组件: `examples/react-app-registry.tsx`
- 样式文件: `examples/app-registry-styles.css`

## API 参考

详细的 API 文档请参考：
- [AppRegistryClient API](./api/app-registry-client.md)
- [React Hooks API](./api/app-registry-hooks.md)
- [类型定义](./api/app-registry-types.md)

## 故障排除

### 常见问题

1. **客户端未初始化**
   ```typescript
   const client = await AppRegistryClient.create();
   if (!client.isReady()) {
     console.error('App Registry 客户端未就绪');
   }
   ```

2. **Tauri 命令调用失败**
   - 确保后端已注册相应的 Tauri 命令
   - 检查 `src-tauri/src/main.rs` 中的命令导入

3. **React Hook 数据不更新**
   - 检查 `autoRefresh` 设置
   - 手动调用 `refresh()` 函数

4. **类型错误**
   - 确保正确导入类型定义
   - 检查 TypeScript 配置

### 调试技巧

```typescript
// 启用详细日志
const client = await AppRegistryClient.create();
console.log('App Registry 客户端状态:', {
  isReady: client.isReady(),
  isHttpMode: client.isHttpMode,
  isProxyMode: client.isProxyMode,
  isTauriNative: client.isTauriNative
});

// 监控网络请求
// 在浏览器开发工具中查看 Tauri 命令调用
```

## 贡献指南

如需为 App Registry 客户端贡献代码，请遵循以下步骤：

1. 确保代码风格与现有 Plugin 系统一致
2. 添加适当的类型定义和文档
3. 编写单元测试和集成测试
4. 更新相关文档

## 许可证

MIT License - 详见项目根目录 LICENSE 文件。