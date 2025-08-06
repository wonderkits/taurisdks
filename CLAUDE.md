# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在该代码库中工作时提供指导。

## 项目概述

这是一个 TypeScript monorepo，包含为 WonderKits 生态系统开发的 Tauri SDK 工具。它提供了一套完整的工具包，用于开发与 Tauri 桌面应用程序集成的微前端应用。

## 架构设计

### 包结构
- **@wonderkits/cli**: 脚手架工具，用于创建 WonderKits 应用，包含模板和开发命令
- **@wonderkits/client**: 通用客户端 SDK，提供智能多模式 Tauri 插件访问 (Native/Proxy/HTTP)

### 核心设计模式

**统一客户端管理**: 提供 `WonderKitsClient` 统一管理器，避免每个服务重复的 `initForDevelopment` 逻辑。支持智能环境检测和统一配置管理。

**多模式运行时**: 客户端自动检测并在三种执行模式间切换:
- `tauri-native`: 直接访问 Tauri 插件 (生产环境)
- `tauri-proxy`: 通过主应用代理 (Wujie 微前端)
- `http`: HTTP 桥接服务 (开发环境)

**微前端集成**: 设计用于与位于 `/Users/jiaoyingjun/work/coder/magicteam` 的主应用配合工作，主应用使用 Wujie 框架加载子应用。子应用可以作为独立的 Wujie 应用或 ES 模块运行。

**双构建模式**: 应用可以两种模式构建:
- **库模式**: 用于与主应用集成 (`npm run build:lib`)
- **独立模式**: 用于独立开发和测试 (`npm run build`)

## 常用开发命令

### 根级别 (MonoRepo)
```bash
# 安装所有依赖
npm install

# 构建所有包
npm run build

# 所有包的开发模式
npm run dev

# 发布所有包到 NPM
npm run publish:all

# 运行所有包的代码检查
npm run lint

# 所有包的类型检查
npm run typecheck
```

### CLI 包开发
```bash
# 从模板创建新应用
npx @wonderkits/cli create <app-name>

# 本地测试 CLI 命令
npm run build && node dist/index.js create test-app
```

### Client 包开发
```bash
# 使用 Rollup 构建 (生成 ESM, CJS 和 TypeScript 声明文件)
npm run build

# 开发监视模式
npm run dev

# 清理构建产物
npm run clean
```

### 统一客户端使用示例
```typescript
// 推荐方式：使用统一客户端管理器
import { initForDevelopment } from '@wonderkits/client';

const client = await initForDevelopment({
  sql: { connectionString: 'sqlite:app.db' },
  store: { filename: 'app.store' },
  fs: {}
}, {
  httpPort: 8080,
  verbose: true
});

// 使用服务
const database = client.sql();
const store = client.store();
const fs = client.fs();

// 执行操作
await database.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
await store.set('version', '1.0.0');
await fs.writeTextFile('config.json', '{"env": "dev"}');
```


## 构建系统详解

### TypeScript 项目引用
monorepo 使用 TypeScript 项目引用和路径映射。根目录 `tsconfig.json` 定义包别名:
```typescript
"@wonderkits/client": ["./packages/client/src"]
"@wonderkits/cli": ["./packages/cli/src"]
```

### 多格式输出 (Client 包)
使用 Rollup 生成多个入口点和格式:
- 主入口: `src/index.ts` → `dist/index.{js,esm.js,d.ts}`
- SQL 模块: `src/sql.ts` → `dist/sql.{js,esm.js,d.ts}`
- Store 模块: `src/store.ts` → `dist/store.{js,esm.js,d.ts}`
- FS 模块: `src/fs.ts` → `dist/fs.{js,esm.js,d.ts}`

### 应用模板系统
CLI 在 `packages/cli/templates/default/` 中提供完整的应用模板:
- `app.config.ts`: 应用配置和集成点
- `vite.config.ts`: 双模式构建配置 (库/独立)
- 带占位符替换的组件和服务模板

## 与主应用的集成

### Tauri 插件代理系统
主应用为 Tauri 插件提供代理服务:
- `TauriSqlProxy`: 数据库连接管理和查询执行
- `TauriStoreProxy`: 键值存储操作
- `TauriFsProxy`: 文件系统操作

### 应用配置
每个子应用通过 `app.config.ts` 定义其集成:
```typescript
export const appConfig: AppConfig = {
  manifest: { id, name, version, description },
  navigation: { name, href, icon, order },
  routes: [/* React Router 配置 */],
  hooks: { onInstall, onActivate, onDeactivate, onUninstall },
  entry: () => import('./index')
};
```

### 环境检测逻辑
客户端 SDK 自动检测运行时环境:
```typescript
detectMode(): ClientMode {
  if (window.__TAURI__) return 'tauri-native';
  if (window.$wujie) return 'tauri-proxy';
  return 'http';
}
```

## 理解架构的关键文件

- `packages/client/src/index.ts`: 主客户端 SDK 导出和模式检测
- `packages/client/src/types.ts`: 运行时模式的核心类型定义
- `packages/cli/src/commands/create.ts`: 模板生成和项目脚手架
- `packages/cli/templates/default/src/app.config.ts`: 应用集成模板
- 根目录 `tsconfig.json`: MonoRepo TypeScript 配置和项目引用
- 根目录 `package.json`: 工作空间配置和通用脚本

## 开发工作流

1. **新应用**: 使用 `@wonderkits/cli create` 从模板搭建
2. **开发**: 应用支持集成 (与主应用) 和独立开发两种模式
3. **集成**: 应用通过 `app.config.ts` 注册以供动态加载
4. **构建**: 双模式构建支持库集成和独立部署
5. **发布**: 各个包独立发布到 NPM，具有适当的依赖管理

## 子应用测试

子应用可以在三种环境中测试:
1. **独立**: `npm run dev` 用于独立开发
2. **集成**: 通过主应用的微前端加载器
3. **Tauri**: 具有原生插件访问的完整桌面环境