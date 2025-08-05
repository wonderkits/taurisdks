# @magicteam/client

> Universal Tauri plugin clients with intelligent multi-mode support (Native/Proxy/HTTP)

[![npm version](https://badge.fury.io/js/@magicteam%2Fclient.svg)](https://badge.fury.io/js/@magicteam%2Fclient)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 概述

`@magicteam/client` 提供与 Tauri 插件完全兼容的客户端库，支持多种运行模式，让你的应用可以在任何环境下无缝工作：

- **🎯 Tauri Native**: 直接使用 Tauri 插件（生产环境）
- **🔗 Tauri Proxy**: 通过主应用代理（Wujie 微前端架构）
- **🌐 HTTP Bridge**: 通过 HTTP 服务（开发/独立运行）

## ✨ 特性

- 🔄 **智能环境检测**: 自动选择最佳运行模式
- 📦 **完全兼容**: 与官方 Tauri 插件 API 100% 兼容
- 🛡️ **类型安全**: 完整的 TypeScript 支持
- 🔧 **开发友好**: 内置开发工具和调试功能
- 🚀 **降级机制**: 智能降级确保任何环境下都能工作
- 📱 **微前端支持**: 原生支持 Wujie 微前端架构

## 📦 安装

```bash
npm install @magicteam/client
```

### 可选的 Peer Dependencies

```bash
# 如果在 Tauri 环境中使用
npm install @tauri-apps/plugin-sql @tauri-apps/plugin-store @tauri-apps/plugin-fs
```

## 🎯 快速开始

### SQL 客户端

```typescript
import { Database } from '@magicteam/client';

// 智能模式 - 自动检测环境
const db = await Database.load('sqlite:database.db');

// 开发模式 - 自动降级
const db = await Database.loadForDevelopment('sqlite:database.db');

// 执行 SQL
const result = await db.execute('INSERT INTO users (name) VALUES (?)', ['Alice']);
const users = await db.select('SELECT * FROM users');

await db.close();
```

### Store 客户端

```typescript
import { Store } from '@magicteam/client';

// 加载 Store
const store = await Store.load('settings.json');

// 设置和获取值
await store.set('theme', 'dark');
const theme = await store.get('theme');

// 获取所有键值对
const entries = await store.entries();
```

### 文件系统客户端

```typescript
import { FsClient } from '@magicteam/client';

// 初始化 FS 客户端
const fs = await FsClient.init();

// 文件操作 - 支持 $HOME 变量
await fs.writeTextFile('$HOME/config.json', JSON.stringify(config));
const content = await fs.readTextFile('$HOME/config.json');

// 目录操作
const entries = await fs.readDir('$HOME');
await fs.mkdir('$HOME/myapp', { recursive: true });
```

### 一键初始化所有客户端

```typescript
import { devUtils } from '@magicteam/client';

const clients = await devUtils.initAll({
  sql: { connectionString: 'sqlite:app.db' },
  store: { filename: 'settings.json' },
  fs: {}
});

// 使用客户端
await clients.sql.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');
await clients.store.set('initialized', true);
await clients.fs.writeTextFile('$HOME/app.log', 'App started');
```

## 🔧 环境检测

```typescript
import { environmentDetector, devUtils } from '@magicteam/client';

// 检测当前运行环境
console.log('Is in Tauri:', environmentDetector.isInTauri());
console.log('Is in Wujie:', environmentDetector.isInWujie());
console.log('Current mode:', environmentDetector.detectMode());

// 检测支持的功能
const support = devUtils.detectSupport();
console.log('Support matrix:', support);
```

## 🏗️ 架构说明

### 智能模式切换

库会自动检测运行环境并选择最优模式：

1. **Tauri Native**: 检测到 `window.__TAURI__` 时使用
2. **Tauri Proxy**: 检测到 Wujie 环境且有代理时使用
3. **HTTP Bridge**: 其他情况下使用，连接到本地 HTTP 服务

### 路径解析

FS 客户端支持智能路径解析：

- `$HOME` → 用户主目录
- `$HOME/path` → 用户主目录下的路径
- `/absolute/path` → 绝对路径
- `relative/path` → 相对路径（基于用户主目录）

## 📚 API 参考

### Database

```typescript
class Database {
  static async load(connectionString: string, options?: DatabaseOptions): Promise<Database>
  static async loadForDevelopment(connectionString: string, httpPort?: number): Promise<Database>
  
  async execute(sql: string, params?: any[]): Promise<SqlExecuteResult>
  async select<T>(sql: string, params?: any[]): Promise<T[]>
  async close(): Promise<boolean>
}
```

### Store

```typescript
class Store {
  static async load(filename: string, options?: StoreLoadOptions): Promise<Store>
  static async loadForDevelopment(filename: string, httpPort?: number): Promise<Store>
  
  async set(key: string, value: any): Promise<void>
  async get<T>(key: string): Promise<T | null>
  async delete(key: string): Promise<boolean>
  async clear(): Promise<void>
  async keys(): Promise<string[]>
  async values(): Promise<any[]>
  async entries(): Promise<[string, any][]>
  async length(): Promise<number>
  async save(): Promise<void>
}
```

### FsClient

```typescript
class FsClient {
  static async init(options?: FsClientInitOptions): Promise<FsClient>
  static async initForDevelopment(httpPort?: number): Promise<FsClient>
  
  async readTextFile(path: string): Promise<string>
  async writeTextFile(path: string, content: string): Promise<void>
  async readBinaryFile(path: string): Promise<Uint8Array>
  async writeBinaryFile(path: string, content: Uint8Array | number[]): Promise<void>
  async exists(path: string): Promise<boolean>
  async stat(path: string): Promise<FileInfo>
  async mkdir(path: string, options?: MkdirOptions): Promise<void>
  async remove(path: string): Promise<void>
  async readDir(path: string): Promise<DirEntry[]>
  async copyFile(source: string, destination: string): Promise<void>
}
```

## 🔧 配置选项

### HTTP 服务配置

默认情况下，HTTP 模式连接到 `http://localhost:1421`。你可以通过选项自定义：

```typescript
// 自定义 HTTP 服务地址
const db = await Database.load('sqlite:app.db', {
  httpBaseUrl: 'http://localhost:3000'
});

const store = await Store.load('settings.json', {
  httpBaseUrl: 'http://localhost:3000'
});

const fs = await FsClient.init({
  httpBaseUrl: 'http://localhost:3000'
});
```

## 🚀 开发和调试

### 启用调试日志

```typescript
import { logger } from '@magicteam/client';

// 库会自动输出彩色的调试信息
// 🔄 调试信息
// ✅ 成功信息  
// ❌ 错误信息
// ⚠️ 警告信息
```

### 环境检测

```typescript
import { environmentDetector } from '@magicteam/client';

const mode = environmentDetector.detectMode();
console.log(`当前运行模式: ${mode}`);

const env = environmentDetector.getEnvironment();
console.log(`运行环境: ${env}`);
```

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md)。

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Tauri](https://tauri.app/)
- [Wujie 微前端](https://wujie-micro.github.io/doc/)
- [问题反馈](https://github.com/magicteam/client/issues)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/magicteam">MagicTeam</a>
</p>