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
        ├── hooks.ts        # 核心 React Hooks
        ├── store.ts        # Zustand 状态管理
        └── app-registry-hooks.ts # App Registry 专用 Hooks
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

## 📋 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循现有的代码结构和命名约定
- 添加完善的类型定义和注释

### 错误处理
- 使用统一的日志系统 (`logger.info/warn/error`)
- 实现优雅的错误处理和回退机制
- 在关键路径添加详细的错误信息

### 性能考虑
- 使用动态导入避免不必要的依赖
- 实现懒加载和按需初始化
- 添加连接验证但不阻塞创建过程

## 🔗 相关链接

- [GitHub Repository](https://github.com/your-org/wonderkits)
- [API 文档](./docs/)
- [示例项目](./examples/)

---

**重要提示**: 开发新插件或维护现有插件时，请务必先阅读 **[插件开发指南](./PLUGIN_DEVELOPMENT_GUIDE.md)**，它包含了完整的开发实战经验和标准化流程。