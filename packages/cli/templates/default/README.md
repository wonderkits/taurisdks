# {{APP_DISPLAY_NAME}}

{{APP_DESCRIPTION}}

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 集成开发模式（与主程序集成）
npm run dev
```

### 构建

```bash
# 生产构建
npm run build

# 开发构建
npm run build:dev
```

### 测试

```bash
# 运行测试
npm run test

# 生成覆盖率报告
npm run test:coverage
```

### 代码检查

```bash
# ESLint 检查
npm run lint

# TypeScript 类型检查
npm run typecheck
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Dashboard.tsx   # 仪表盘组件
│   ├── Settings.tsx    # 设置组件
│   └── icons/          # 图标组件
├── stores/             # Zustand 状态管理
├── services/           # 业务服务层
├── app.config.ts       # 应用配置
├── index.tsx          # 应用入口
└── standalone.tsx     # 独立开发入口
```

## 开发指南

### 状态管理

本应用使用 [Zustand](https://github.com/pmndrs/zustand) 进行状态管理。状态存储在 `src/stores/` 目录下。

```typescript
import { use{{APP_DISPLAY_NAME}}Store } from './stores/{{APP_NAME}}Store';

function MyComponent() {
  const { data, loadData } = use{{APP_DISPLAY_NAME}}Store();
  // ...
}
```

### 服务层

业务逻辑封装在服务层中，位于 `src/services/` 目录。

```typescript
import { {{APP_NAME}}Service } from './services/{{APP_NAME}}Service';

// 获取数据
const data = await {{APP_NAME}}Service.getData();
```

### 应用配置

应用的配置信息在 `src/app.config.ts` 中定义，包括：

- 应用元数据
- 导航配置
- 路由配置
- 生命周期钩子

### 独立开发

在独立开发模式下，应用可以脱离主程序运行，便于开发和调试。

```bash
npm run dev
```

访问 `http://localhost:3001` 查看应用。

## 部署

### 构建分发包

```bash
npm run build
magicteam package
```

### 发布到应用商店

```bash
magicteam publish
```

## 许可证

MIT License

## 作者

{{APP_AUTHOR}}