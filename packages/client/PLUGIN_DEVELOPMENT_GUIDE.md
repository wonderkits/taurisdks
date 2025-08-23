# WonderKits 插件开发指南：App Registry 封装实战总结

## 📋 概述

本文档记录了 App Registry 插件从零到完整封装的全过程，总结了插件开发的关键模式、最佳实践和核心要点，为后续插件开发和维护提供参考指南。

## 🎯 项目背景

### 原始需求
基于对现有 plugin 实现（SQL、Store、FS）和当前 app_registry 模块的分析，设计 app_registry 的封装架构，参考 plugin 的多模式统一接口设计。

### 目标架构
实现与其他插件一致的调用模式：
```typescript
const database = client.sql();
const store = client.store(); 
const fs = client.fs();
const appRegistry = client.appRegistry(); // 新增
```

## 🏗️ 核心架构设计

### 1. 多模式统一接口模式

所有 WonderKits 插件都遵循**多模式统一接口**的设计模式：

```typescript
export class PluginClient implements BaseClient {
  // 模式标识
  readonly isHttpMode: boolean;
  readonly isProxyMode: boolean; 
  readonly isTauriNative: boolean;

  // 智能工厂方法
  static async create(options?: PluginOptions): Promise<PluginClient> {
    // 环境检测 → 模式选择 → 客户端创建
  }

  // 统一接口方法
  async getResource(): Promise<Resource[]> {
    if (this.isHttpMode) return this.getResourceViaHttp();
    if (this.isProxyMode) return this.getResourceViaProxy();
    if (this.isTauriNative) return this.getResourceViaTauri();
  }
}
```

### 2. 三种运行模式

| 模式 | 使用场景 | 实现方式 | 优先级 |
|------|----------|----------|--------|
| **Tauri Native** | 原生桌面应用 | 直接调用 Tauri API | 🥇 最高 |
| **Wujie Proxy** | 微前端子应用 | 通过主应用代理 | 🥈 中等 |
| **HTTP Mode** | 独立开发/Web | 直接 HTTP 请求 | 🥉 回退 |

### 3. 智能环境检测

```typescript
static detectMode(): 'tauri-native' | 'tauri-proxy' | 'http' {
  // 1. 检测 Tauri 原生环境
  if (environmentDetector.isInTauri()) {
    return 'tauri-native';
  }
  
  // 2. 检测 Wujie 环境中的代理
  if (environmentDetector.isInWujie()) {
    if (window.$wujie?.props?.pluginService) {
      return 'tauri-proxy';
    }
    return 'http'; // 代理不可用时回退
  }
  
  // 3. 默认 HTTP 模式
  return 'http';
}
```

## 🔧 实现关键点

### 1. 文件结构规范

```
src/plugin/
├── plugin-name.ts           # 主插件实现
├── types.ts                 # 类型定义 (可选)
└── __tests__/              # 测试文件
    ├── unit.test.ts         # 单元测试
    ├── integration.test.ts  # 集成测试
    └── mode-detection.test.ts # 模式检测测试
```

### 2. 核心接口实现

```typescript
export class AppRegistryClient implements BaseClient {
  private httpBaseUrl: string | null = null;
  private wujieProxy: any = null;
  
  constructor(
    httpBaseUrl?: string | null,
    wujieProxy?: any
  ) {
    // 模式检测和初始化
    this.detectAndSetMode(httpBaseUrl, wujieProxy);
  }

  // 智能工厂方法
  static async create(options: PluginOptions = {}): Promise<AppRegistryClient> {
    const mode = this.detectMode();
    switch (mode) {
      case 'tauri-native':
        return this.createViaTauri();
      case 'tauri-proxy': 
        return this.createViaProxy();
      case 'http':
      default:
        return this.createViaHttp(options.httpBaseUrl);
    }
  }
}
```

### 3. 错误处理和回退机制

```typescript
// 环境检测错误处理
isInTauri(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.__TAURI__;
  } catch (error) {
    return false; // 检测失败时安全回退
  }
}

// 模式切换错误处理
static detectMode(): AppRegistryMode {
  if (environmentDetector.isInWujie()) {
    try {
      if (window.$wujie?.props?.appRegistry) {
        return 'tauri-proxy';
      }
    } catch (error) {
      logger.debug('代理访问错误，回退到 HTTP 模式');
      return 'http';
    }
  }
  return 'http';
}
```

### 4. 动态导入处理

```typescript
async function importTauriPlugin(pluginName: string) {
  try {
    // 使用动态导入避免编译时依赖
    const module = await import('@tauri-apps/api/core');
    return module;
  } catch (error) {
    throw new Error(`${pluginName} 插件加载失败`);
  }
}
```

## 🧪 测试策略

### 1. 三层测试架构

```typescript
// 1. 单元测试 - 基础功能和模式检测
describe('Constructor and Mode Detection', () => {
  test('should create HTTP mode client correctly');
  test('should create Tauri native mode client correctly'); 
  test('should create proxy mode client correctly');
});

// 2. 集成测试 - 与真实服务交互
describe('Service Connectivity', () => {
  beforeAll(async () => {
    // 检查真实服务可用性
    const response = await fetch('http://localhost:1421/api/health');
  });
});

// 3. 模式检测测试 - 环境检测逻辑
describe('Environment Detection Edge Cases', () => {
  test('should handle missing window object');
  test('should handle Tauri environment detection errors');
});
```

### 2. Mock 和环境模拟

```typescript
const mockWindow = (overrides = {}) => {
  Object.defineProperty(global, 'window', {
    value: { ...overrides },
    writable: true,
    configurable: true
  });
};

const mockFetch = (response: any) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: response.ok !== false,
    json: jest.fn().mockResolvedValue(response.data)
  });
};
```

## 🔗 统一客户端集成

### 1. 服务注册

```typescript
// core/client.ts
export interface ClientServices {
  sql?: SqlServiceConfig;
  store?: StoreServiceConfig;
  fs?: FsServiceConfig;
  appRegistry?: AppRegistryServiceConfig; // 新增
}

// 服务初始化
private async initAppRegistryService(config: AppRegistryServiceConfig) {
  this.services.appRegistry = await retryWithFallback(
    () => AppRegistryClient.create(config),
    () => AppRegistryClient.create({ 
      httpBaseUrl: this.getHttpBaseUrl() 
    }),
    'App Registry 初始化失败'
  );
}
```

### 2. 便捷访问方法

```typescript
export class WonderKitsClient {
  appRegistry(): AppRegistryClient {
    this.ensureServiceInitialized('appRegistry');
    return this.services.appRegistry!;
  }
}
```

### 3. React Hooks 集成

```typescript
// framework/react/hooks.ts - 统一集成到主 hooks 文件
export function useApps(options: UseAppsOptions = {}) {
  const [apps, setApps] = useState<RegisteredApp[]>([]);
  const [loading, setLoading] = useState(true);
  
  const refresh = useCallback(async () => {
    const result = await appRegistryClient.getApps(options);
    setApps(result);
  }, [options]);
  
  return { apps, loading, refresh };
}
```

## 📋 开发清单

### 插件开发必做事项

#### ✅ 架构设计
- [ ] 分析现有插件模式（SQL、Store、FS）
- [ ] 确定插件的三种运行模式需求
- [ ] 设计统一接口和类型定义
- [ ] 规划错误处理和回退策略

#### ✅ 核心实现
- [ ] 实现 `BaseClient` 接口
- [ ] 添加模式标识属性（`isHttpMode`、`isProxyMode`、`isTauriNative`）
- [ ] 实现静态工厂方法 `create()`
- [ ] 实现环境检测逻辑
- [ ] 添加动态导入支持
- [ ] 实现三种模式的具体逻辑

#### ✅ 统一客户端集成
- [ ] 在 `ClientServices` 接口中添加服务定义
- [ ] 实现服务初始化方法
- [ ] 添加便捷访问方法
- [ ] 更新 API 路径管理器
- [ ] 实现重试和回退机制

#### ✅ React Hooks（如需要）
- [ ] 创建业务专用 hooks
- [ ] 实现状态管理和自动刷新
- [ ] 添加错误处理和加载状态
- [ ] 导出到主 React 模块

#### ✅ 测试覆盖
- [ ] 单元测试：构造函数、模式检测、方法可用性
- [ ] 集成测试：真实服务连接、数据验证、性能测试
- [ ] 模式检测测试：环境检测、错误处理、边界情况
- [ ] 更新 Jest 配置支持测试目录

#### ✅ 文档和示例
- [ ] 创建 API 使用示例
- [ ] 编写 React 组件示例
- [ ] 记录关键设计决策
- [ ] 更新主文档的插件列表

## 🚨 常见陷阱和解决方案

### 1. TypeScript 编译错误

**问题**: `@tauri-apps/api/core` 模块在测试环境中不存在
```typescript
// ❌ 直接导入会导致编译错误
import { invoke } from '@tauri-apps/api/core';

// ✅ 使用动态导入
const tauriCore = await import('@tauri-apps/api/core');
```

### 2. 环境检测错误

**问题**: 访问 `window.__TAURI__` 时抛出异常
```typescript
// ❌ 没有错误处理
isInTauri(): boolean {
  return typeof window !== 'undefined' && !!window.__TAURI__;
}

// ✅ 添加 try-catch 保护
isInTauri(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.__TAURI__;
  } catch (error) {
    return false;
  }
}
```

### 3. 测试异步日志问题

**问题**: Jest 报告 "Cannot log after tests are done"
```typescript
// ✅ 在测试后清理客户端
afterAll(async () => {
  if (client) {
    await client.cleanup();
  }
});
```

### 4. Jest 配置问题

**问题**: 测试文件无法被识别
```javascript
// jest.config.mjs
export default {
  testMatch: [
    '**/src/**/*.test.ts',
    '**/tests/**/*.test.ts',
    '**/__tests__/**/*.test.ts', // 添加 __tests__ 支持
  ],
};
```

## 📊 性能考量

### 1. 懒加载和按需导入

```typescript
// 只在需要时导入 Tauri API
private async getAppsViaTauri(): Promise<RegisteredApp[]> {
  const tauriCore = await importTauriPlugin('@tauri-apps/api/core');
  return tauriCore.invoke('plugin:app_registry|get_apps');
}
```

### 2. 连接验证优化

```typescript
// HTTP 模式在创建时验证连接，但不阻塞创建
static async createViaHttp(baseUrl: string) {
  const client = new AppRegistryClient(baseUrl);
  
  try {
    await client.healthCheck();
    logger.success('HTTP 服务连接验证成功');
  } catch (error) {
    logger.warn('连接验证失败，但继续创建客户端', error);
  }
  
  return client;
}
```

## 🔄 维护指南

### 版本兼容性
- 保持向后兼容的 API 接口
- 新增功能使用可选参数
- 废弃功能使用 `@deprecated` 标记

### 监控和调试
- 使用统一的日志系统（`logger.info/warn/error`）
- 添加详细的错误信息和上下文
- 在关键路径添加调试日志

### 测试维护
- 定期运行完整测试套件
- 保持与真实服务的集成测试
- 监控测试覆盖率

## 📈 扩展指南

### 添加新的运行模式
1. 在模式检测中添加新的判断逻辑
2. 实现对应的 `createVia*` 方法
3. 添加相应的模式标识属性
4. 更新所有业务方法的路由逻辑
5. 补充对应的测试用例

### 添加新的业务方法
1. 在接口中定义方法签名
2. 实现三种模式的具体逻辑
3. 添加错误处理和数据验证
4. 补充单元测试和集成测试
5. 更新 React Hooks（如需要）

## 🎉 总结

通过 App Registry 插件的完整开发实践，我们建立了一套成熟的插件开发模式：

1. **标准化架构**: 多模式统一接口 + 智能环境检测
2. **健壮性保证**: 完善的错误处理 + 回退机制  
3. **开发效率**: 统一客户端集成 + React Hooks
4. **质量保障**: 三层测试架构 + 46个测试用例

这套模式可以直接复制到其他插件的开发中，大大提升开发效率和代码质量。

---
*本文档基于 App Registry 插件实际开发过程整理，包含所有关键决策和实现细节，可作为后续插件开发的标准参考。*