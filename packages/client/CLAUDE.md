# WonderKits Client 开发指南

这是 WonderKits 统一客户端库，提供多模式智能切换的插件架构。

## 🏗️ 项目结构

```
src/
├── core/                    # 核心框架
│   ├── client.ts           # 统一客户端主类
│   ├── utils.ts            # 工具函数和环境检测
│   └── types.ts            # 核心类型定义
├── plugin/                  # 插件模块
│   ├── sql.ts              # SQL 数据库插件
│   ├── store.ts            # Store 存储插件  
│   ├── fs.ts               # 文件系统插件
│   └── app-registry.ts     # 应用注册中心插件
└── framework/               # 框架集成
    └── react/              # React 集成
        ├── hooks.ts        # 统一 React Hooks（包含 App Registry）
        ├── store.ts        # Zustand 状态管理
        └── index.ts        # React 模块导出
```

## 🔌 插件架构

所有插件都遵循**多模式统一接口**设计：

### 三种运行模式
- **Tauri Native**: 原生桌面应用，直接调用 Tauri API
- **Wujie Proxy**: 微前端子应用，通过主应用代理  
- **HTTP Mode**: 独立开发/Web，直接 HTTP 请求

### 智能环境检测
插件会自动检测运行环境并选择最适合的模式，支持优雅降级。

## 📚 重要文档

### 核心开发文档
- **[插件开发指南](./PLUGIN_DEVELOPMENT_GUIDE.md)**: 完整的插件开发实战指南
  - 基于 App Registry 插件开发的完整经验总结
  - 包含架构设计、实现关键点、测试策略等
  - 提供开发清单和常见问题解决方案
  - **必读文档**：新插件开发或现有插件维护的标准参考

- **[重构指南](./REFACTORING_GUIDE.md)**: 详细的架构重构文档
  - 统一服务初始化架构的设计思路和实现
  - 代码冗余消除和配置结构化的完整过程
  - API简化和开发体验提升的具体措施
  - **核心参考**：理解当前架构设计原则的重要文档

- **[App Registry 文档](./docs/app-registry.md)**: 应用注册中心插件详细说明

- **[迁移指南](./MIGRATION.md)**: 版本升级和迁移说明

### 示例代码
- `examples/unified-client.ts`: 统一客户端基础使用示例
- `examples/unified-client-with-app-registry.ts`: 带 App Registry 的完整示例
- `examples/react-integration.tsx`: React 集成示例
- `examples/react-app-registry.tsx`: App Registry React 组件示例

## 🧪 测试架构

采用三层测试架构确保代码质量：

```
__tests__/
└── app-registry/           # 按插件组织测试
    ├── unit.test.ts        # 单元测试：基础功能和模式检测
    ├── integration.test.ts # 集成测试：与真实服务交互
    └── mode-detection.test.ts # 模式检测测试：环境检测逻辑
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定插件的测试
npm test __tests__/app-registry/

# 运行特定测试类型
npm test unit.test.ts
npm test integration.test.ts
```

## 🚀 开发工作流

### 新增插件
1. 参考 **[插件开发指南](./PLUGIN_DEVELOPMENT_GUIDE.md)** 
2. 按照开发清单逐步实现
3. 确保所有测试通过
4. 更新相关文档

### 维护现有插件  
1. 运行相关测试确保功能正常
2. 参考插件开发指南的维护章节
3. 保持 API 向后兼容
4. 更新测试覆盖新功能

### 集成测试
项目支持与真实服务的集成测试：
- 需要后端服务运行在 `localhost:1421`
- 集成测试会检查服务可用性并跳过不可用的测试
- 推荐在开发和 CI 环境中运行完整测试套件

## 🏛️ 架构原则和设计规范

### 核心架构原则

#### 1. 统一性原则 (Consistency Principle)
- **单一客户端管理**: 所有服务通过 `WonderKitsClient` 统一管理
- **统一初始化流程**: 所有服务使用相同的初始化模式和错误处理
- **一致的API设计**: 相似功能使用相同的方法签名和命名约定

#### 2. 简化性原则 (Simplicity Principle)  
- **配置结构化**: 使用嵌套 `services` 对象而非平铺配置
- **API最小化**: 避免重复方法，提供清晰的核心API
- **参数化设计**: 通过参数而非代码重复实现功能差异化

#### 3. 可扩展性原则 (Extensibility Principle)
- **泛型架构**: 使用 `initService<T>()` 支持类型安全的服务扩展
- **插件模式**: 新服务可以轻松集成到统一初始化流程
- **配置灵活性**: 同时支持布尔值快捷配置和对象详细配置

#### 4. 开发体验原则 (Developer Experience Principle)
- **类型安全**: 完整的 TypeScript 类型定义和智能提示
- **错误友好**: 清晰的错误信息和调试日志
- **渐进式迁移**: 保持向后兼容的API演进路径

### 统一服务初始化架构

#### 核心设计模式
使用**模板方法模式**结合**策略模式**实现统一的服务初始化：

```typescript
// 核心模板方法
private async initService<T>(
  serviceName: keyof ClientServices, 
  config: any, 
  initializer: (config: any, options: any) => Promise<T>
): Promise<void>

// 具体策略实现
await this.initService('sql', sqlConfig, SqlClient.load);
await this.initService('store', storeConfig, StoreClient.load);
await this.initService('fs', fsConfig, FsClient.load);
await this.initService('appRegistry', appRegistryConfig, AppRegistryClient.createViaHttp);
```

#### 架构优势
- **代码复用**: 75%+ 的重复代码消除
- **类型安全**: 泛型保证编译时类型检查
- **错误一致**: 统一的错误处理和日志记录
- **易于扩展**: 新服务只需提供初始化器函数

### 配置设计最佳实践

#### 结构化配置模式
```typescript
// ✅ 推荐：结构化配置
{
  services: {
    fs: true,                              // 布尔快捷方式
    store: { filename: 'app.json' },       // 对象详细配置
    sql: { connectionString: 'sqlite:app.db' },
    appRegistry: true
  },
  httpPort: 1420,
  verbose: true
}

// ❌ 避免：平铺配置
{
  enableFs: true,
  enableStore: true,
  storeFilename: 'app.json',
  enableSql: true,
  sqlConnectionString: 'sqlite:app.db'
}
```

#### 配置验证原则
- **类型驱动**: 使用 TypeScript 接口定义配置结构
- **默认值**: 为所有可选配置提供合理默认值  
- **验证友好**: 在运行时验证关键配置项
- **错误清晰**: 配置错误时提供具体的修复建议

## 📋 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循现有的代码结构和命名约定
- 添加完善的类型定义和注释
- **优先使用统一的 `initService<T>()` 模式添加新服务**

### 错误处理
- 使用统一的日志系统 (`logger.info/warn/error`)
- 实现优雅的错误处理和回退机制
- 在关键路径添加详细的错误信息
- **所有服务初始化都使用 `retryWithFallback` 函数**

### 性能考虑
- 使用动态导入避免不必要的依赖
- 实现懒加载和按需初始化
- 添加连接验证但不阻塞创建过程
- **并行初始化多个服务而非串行**

### 新服务开发清单
1. **创建服务插件**: 在 `src/plugin/` 下创建服务文件
2. **实现初始化器**: 提供静态 `load` 或 `create` 方法
3. **添加类型定义**: 在 `ClientServices` 接口中添加服务类型
4. **注册到客户端**: 在 `initServices` 中使用统一的 `initService<T>()` 调用
5. **更新配置接口**: 在相应的配置接口中添加服务配置选项
6. **编写测试**: 按照三层测试架构添加测试用例
7. **更新文档**: 在示例代码和文档中包含新服务

## 🔗 相关链接

- [GitHub Repository](https://github.com/your-org/wonderkits)
- [API 文档](./docs/)
- [示例项目](./examples/)

---

## 🎯 重要提示

### 开发新功能
1. **架构优先**: 遵循上述架构原则，特别是统一性和简化性原则
2. **重构参考**: 开发前请阅读 **[重构指南](./REFACTORING_GUIDE.md)** 了解当前架构设计思路
3. **插件开发**: 新插件开发请参考 **[插件开发指南](./PLUGIN_DEVELOPMENT_GUIDE.md)** 的标准化流程

### 维护现有代码
1. **统一初始化**: 所有服务初始化都应使用 `initService<T>()` 模式
2. **配置结构化**: 新配置选项应加入 `services` 对象而非平铺
3. **类型安全**: 确保所有新功能都有完整的 TypeScript 类型定义

### API设计
1. **一致性**: 新API应与现有API保持风格一致
2. **简化性**: 优先提供简单的默认行为，复杂配置作为可选项
3. **向后兼容**: API变更需要提供迁移路径和废弃警告

**核心原则**: 在添加任何新功能前，请确保理解并遵循本文档中的架构原则和设计规范。