# @wonderkits/client

> 🎯 **极简全局管理版本** - Universal Tauri plugin clients with intelligent multi-mode support (Native/Proxy/HTTP). Pure JavaScript, no framework dependencies.

[![npm version](https://badge.fury.io/js/@wonderkits%2Fclient.svg)](https://badge.fury.io/js/@wonderkits%2Fclient)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 概述

`@wonderkits/client` 是一个**纯 JavaScript 客户端库**，提供与 Tauri 插件完全兼容的 API，支持多种运行模式。采用极简的全局单例管理，**无任何框架依赖**，可在任何 JavaScript 环境中使用。

### 🎯 三种运行模式

- **🎯 Tauri Native**: 直接使用 Tauri 插件（生产环境）
- **🔗 Tauri Proxy**: 通过主应用代理（Wujie 微前端架构）
- **🌐 HTTP Bridge**: 通过 HTTP 服务（开发/独立运行）

### ✨ 版本 2.0 重大更新

- ⚡ **极简架构**: 移除复杂的 React 状态管理，采用全局单例模式
- 🎯 **零框架依赖**: 纯 JavaScript，适用于任何环境（React、Vue、Angular、原生JS）
- 🚀 **更小包体积**: 移除所有 React 相关依赖
- 📦 **更简单的 API**: 一次初始化，全局使用

## ✨ 特性

- 🔄 **智能环境检测**: 自动选择最佳运行模式
- 📦 **完全兼容**: 与官方 Tauri 插件 API 100% 兼容
- 🛡️ **类型安全**: 完整的 TypeScript 支持
- 🔧 **开发友好**: 内置开发工具和调试功能
- 🚀 **降级机制**: 智能降级确保任何环境下都能工作
- 📱 **微前端支持**: 原生支持 Wujie 微前端架构
- 🎯 **全局单例**: 一次初始化，全局共享，避免重复创建
- 💪 **无框架绑定**: 适用于任何 JavaScript 环境

## 📦 安装

```bash
npm install @wonderkits/client
```

### 可选的 Peer Dependencies

```bash
# 如果在 Tauri 环境中使用
npm install @tauri-apps/plugin-sql @tauri-apps/plugin-store @tauri-apps/plugin-fs
```

## 🎯 快速开始

### 极简全局管理使用方式

```typescript
import { 
  initWonderKits, 
  getSql, 
  getStore, 
  getFs, 
  getAppRegistry 
} from '@wonderkits/client';

// 1. 全局初始化（通常在应用启动时）
await initWonderKits({
  services: {
    sql: { connectionString: 'sqlite:app.db' },
    store: { filename: 'app.json' },
    fs: true,
    appRegistry: true
  },
  verbose: true
});

// 2. 在任何地方直接使用服务
const sql = getSql();
const store = getStore();
const fs = getFs();
const appRegistry = getAppRegistry();

// 执行操作
await sql.execute('CREATE TABLE users (id INTEGER, name TEXT)');
await store.set('version', '2.0.0');
await fs.writeTextFile('config.json', '{"env": "production"}');
```

### React 项目中使用（可选 Hooks）

如果你在 React 项目中，可以创建简单的 hooks：

```typescript
// hooks.ts（在你的 React 项目中创建）
import { 
  getWonderKitsClient, 
  getSql, 
  getStore, 
  getFs, 
  getAppRegistry 
} from '@wonderkits/client';

export const useWonderKits = () => getWonderKitsClient();
export const useSql = () => getSql();
export const useStore = () => getStore();
export const useFs = () => getFs();
export const useAppRegistry = () => getAppRegistry();
```

```tsx
// MyComponent.tsx
import { useSql, useStore } from './hooks';

function MyComponent() {
  const sql = useSql();
  const store = useStore();

  const handleSave = async () => {
    await sql.execute('INSERT INTO users (name) VALUES (?)', ['John']);
    await store.set('lastSaved', Date.now());
  };

  return <button onClick={handleSave}>Save Data</button>;
}
```

## 🔧 详细使用指南

### 配置选项

```typescript
interface WonderKitsSimpleConfig {
  /** 服务配置 */
  services?: {
    fs?: boolean | object;
    store?: boolean | { filename?: string };
    sql?: boolean | { connectionString?: string };
    appRegistry?: boolean | object;
  };
  /** HTTP 服务端口（默认 1420） */
  httpPort?: number;
  /** HTTP 服务主机地址（默认 'localhost'） */
  httpHost?: string;
  /** 强制指定运行模式 */
  forceMode?: 'tauri-native' | 'tauri-proxy' | 'http';
  /** 是否启用详细日志 */
  verbose?: boolean;
}
```

### API 参考

#### 初始化和管理

```typescript
// 全局初始化
await initWonderKits(config?: WonderKitsSimpleConfig): Promise<WonderKitsClient>

// 获取全局客户端实例
getWonderKitsClient(): WonderKitsClient

// 检查是否已初始化
isWonderKitsInitialized(): boolean

// 重置（仅用于测试）
resetWonderKits(): void
```

#### 便捷服务访问

```typescript
// 获取各种服务
getSql(): Database
getStore(): Store
getFs(): FsClient
getAppRegistry(): AppRegistryClient
```

### SQL 数据库操作

```typescript
const sql = getSql();

// 执行SQL
await sql.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');

// 查询数据
const users = await sql.select('SELECT * FROM users WHERE name = ?', ['John']);

// 批量操作
await sql.execute('BEGIN');
await sql.execute('INSERT INTO users (name) VALUES (?)', ['Alice']);
await sql.execute('INSERT INTO users (name) VALUES (?)', ['Bob']);
await sql.execute('COMMIT');
```

### Store 键值存储

```typescript
const store = getStore();

// 设置值
await store.set('user.name', 'John Doe');
await store.set('app.version', '2.0.0');

// 获取值
const userName = await store.get('user.name');
const version = await store.get('app.version');

// 删除值
await store.delete('temp.data');

// 清空所有
await store.clear();
```

### 文件系统操作

```typescript
const fs = getFs();

// 写入文件
await fs.writeTextFile('config.json', JSON.stringify({ theme: 'dark' }));

// 读取文件
const content = await fs.readTextFile('config.json');

// 创建目录
await fs.createDir('logs', { recursive: true });

// 列出目录内容
const entries = await fs.readDir('logs');
```

### App Registry 应用管理

```typescript
const appRegistry = getAppRegistry();

// 注册应用
const appId = await appRegistry.registerApp({
  manifest: {
    id: 'my-app',
    name: 'My Application',
    version: '1.0.0',
    description: 'A sample application'
  },
  entry: () => import('./app')
});

// 获取已注册的应用
const apps = await appRegistry.getApps();

// 激活应用
await appRegistry.activateApp(appId);
```

## 🔄 从 1.x 版本迁移

### 主要变化

1. **移除 React 依赖**: 不再需要 `react`, `zustand` 等依赖
2. **简化初始化**: 使用 `initWonderKits()` 替代复杂的 hooks 和 store
3. **全局访问**: 使用 `getSql()`, `getStore()` 等函数替代 hooks

### 迁移步骤

**Before (v1.x)**:
```typescript
// 1.x 版本使用方式
import { useWonderKits, initWonderKits } from '@wonderkits/client/react';

function App() {
  const { client, isConnected, initClient } = useWonderKits();

  useEffect(() => {
    initClient(services, config);
  }, []);

  return <div>...</div>;
}
```

**After (v2.x)**:
```typescript
// 2.x 版本使用方式
import { initWonderKits, getSql, getStore } from '@wonderkits/client';

// 应用启动时初始化
await initWonderKits({
  services: { sql: true, store: true },
  verbose: true
});

// 在任何地方直接使用
function saveData() {
  const sql = getSql();
  const store = getStore();
  
  // 使用服务...
}
```

## 🔧 开发模式

```typescript
// 开发环境快速启动
import { initForDevelopment } from '@wonderkits/client';

const client = await initForDevelopment({
  sql: { connectionString: 'sqlite:dev.db' },
  store: { filename: 'dev-settings.json' },
  fs: {},
  appRegistry: {}
}, {
  httpPort: 8080,
  verbose: true
});
```

## 🎯 运行模式详解

### Tauri Native 模式
```typescript
// 在 Tauri 应用中自动启用
// 直接使用 @tauri-apps/plugin-* APIs
```

### Wujie 代理模式
```typescript
// 在微前端子应用中自动检测
// 通过主应用代理访问 Tauri 插件
```

### HTTP 桥接模式
```typescript
// 开发环境或独立 Web 应用
// 通过 HTTP 服务访问功能
```

## 📚 示例项目

查看 `examples/` 目录获取更多示例：

- `simple-usage.ts` - 基础使用示例
- `react-integration.tsx` - React 集成示例
- `advanced-config.ts` - 高级配置示例

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

## 📄 许可证

MIT © [WonderKits](https://github.com/wonderkits)

---

## 🎯 核心理念

`@wonderkits/client` v2.0 采用"**极简即是极致**"的设计理念：

- 🎯 **单一职责**: 专注于 Tauri 插件的统一访问
- 🚀 **极简 API**: 最少的概念，最直观的使用
- 💪 **无框架绑定**: 适用于任何 JavaScript 环境
- 📦 **最小依赖**: 只依赖必需的 Tauri 插件

**一次初始化，全局可用，简单而强大。**