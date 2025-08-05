# @magicteam/cli

MagicTeam 应用开发命令行工具，用于创建、开发、构建和发布 MagicTeam 微前端应用。

## 安装

```bash
# 全局安装
npm install -g @magicteam/cli

# 或者使用 yarn
yarn global add @magicteam/cli

# 或者使用 pnpm
pnpm add -g @magicteam/cli
```

## 快速开始

### 创建新应用

```bash
# 创建一个新的应用
magicteam create my-awesome-app

# 使用特定模板创建
magicteam create my-app --template utility

# 创建时指定详细信息
magicteam create my-app --author "Your Name" --description "My awesome app"
```

### 开发应用

```bash
# 进入应用目录
cd my-awesome-app

# 启动集成开发模式（与主程序集成）
magicteam dev

# 启动独立开发模式
magicteam dev --standalone

# 指定端口
magicteam dev --port 3002
```

### 构建应用

```bash
# 生产构建
magicteam build

# 开发构建
magicteam build --mode development

# 构建并分析包大小
magicteam build --analyze
```

### 测试应用

```bash
# 运行测试
magicteam test

# 监听模式
magicteam test --watch

# 生成覆盖率报告
magicteam test --coverage
```

### 打包分发

```bash
# 创建分发包
magicteam package

# 指定输出文件
magicteam package --output my-app-v1.0.0.zip

# 包含源代码
magicteam package --include-source
```

### 发布应用

```bash
# 发布到应用商店
magicteam publish

# 指定版本号
magicteam publish --version 1.2.0

# 模拟发布（不实际发布）
magicteam publish --dry-run
```

## 命令详解

### create

创建新的 MagicTeam 应用。

```bash
magicteam create <project-name> [options]
```

**选项:**
- `-t, --template <template>` - 使用指定模板 (default: 'default')
- `--no-git` - 不初始化 Git 仓库
- `--no-install` - 不自动安装依赖
- `-f, --force` - 强制覆盖已存在的目录
- `--author <author>` - 应用作者
- `--description <description>` - 应用描述
- `--category <category>` - 应用分类

**示例:**
```bash
magicteam create todo-app --template utility --author "John Doe"
magicteam create chat-app --category communication --no-git
```

### dev

启动开发服务器。

```bash
magicteam dev [options]
```

**选项:**
- `-p, --port <port>` - 指定端口号 (default: 3001)
- `-h, --host <host>` - 指定主机地址 (default: localhost)
- `-s, --standalone` - 启动独立开发模式
- `--open` - 自动打开浏览器
- `--https` - 使用 HTTPS

**示例:**
```bash
magicteam dev --port 3002 --open
magicteam dev --standalone --https
```

### build

构建应用。

```bash
magicteam build [options]
```

**选项:**
- `-m, --mode <mode>` - 构建模式 (development|production, default: production)
- `--analyze` - 分析打包结果
- `--clean` - 构建前清理输出目录
- `--sourcemap` - 生成 source map

**示例:**
```bash
magicteam build --mode development --sourcemap
magicteam build --analyze --clean
```

### test

运行测试。

```bash
magicteam test [options]
```

**选项:**
- `-w, --watch` - 监听模式
- `-c, --coverage` - 生成覆盖率报告
- `-p, --pattern <pattern>` - 测试文件匹配模式
- `-v, --verbose` - 详细输出
- `-s, --silent` - 静默模式

**示例:**
```bash
magicteam test --coverage --verbose
magicteam test --watch --pattern "*.test.ts"
```

### package

打包应用为分发包。

```bash
magicteam package [options]
```

**选项:**
- `-o, --output <output>` - 输出文件路径
- `-f, --format <format>` - 打包格式 (zip|tar, default: zip)
- `-e, --exclude <patterns...>` - 排除的文件模式
- `--include-source` - 包含源代码

**示例:**
```bash
magicteam package --output dist/my-app.zip
magicteam package --format tar --include-source
```

### publish

发布应用到注册中心。

```bash
magicteam publish [options]
```

**选项:**
- `-v, --version <version>` - 发布版本号
- `-t, --tag <tag>` - 发布标签 (default: latest)
- `-r, --registry <registry>` - 指定注册中心地址
- `--dry-run` - 模拟发布，不实际发布
- `--skip-build` - 跳过构建步骤
- `--skip-tests` - 跳过测试步骤
- `-f, --force` - 强制发布

**示例:**
```bash
magicteam publish --version 1.2.0 --tag beta
magicteam publish --dry-run --skip-tests
```

## 应用模板

CLI 提供了多种应用模板：

### default
标准应用模板，包含：
- React + TypeScript
- Zustand 状态管理
- Vite 构建工具
- 完整的项目结构

### utility (计划中)
工具类应用模板

### education (计划中)
教育类应用模板

### communication (计划中)
通信类应用模板

## 项目结构

使用 CLI 创建的应用具有以下结构：

```
my-app/
├── src/
│   ├── components/          # React 组件
│   │   ├── Dashboard.tsx   # 仪表盘组件
│   │   ├── Settings.tsx    # 设置组件
│   │   └── icons/          # 图标组件
│   ├── stores/             # Zustand 状态管理
│   ├── services/           # 业务服务层
│   ├── test/               # 测试相关文件
│   ├── app.config.ts       # 应用配置
│   ├── index.tsx          # 应用入口
│   └── standalone.tsx     # 独立开发入口
├── public/                 # 静态资源
├── dist/                   # 构建输出
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
├── vitest.config.ts       # 测试配置
├── .eslintrc.json         # ESLint 配置
├── .gitignore            # Git 忽略文件
└── README.md             # 项目说明
```

## 开发指南

### 应用配置

每个应用都有一个 `app.config.ts` 文件，定义应用的元数据、导航、路由和生命周期：

```typescript
import { AppConfig } from '@magicteam/core/types';

export const myAppConfig: AppConfig = {
  manifest: {
    id: 'my-app',
    name: 'my-app',
    displayName: '我的应用',
    version: '1.0.0',
    description: '应用描述',
    author: '作者',
    category: 'utility'
  },
  navigation: {
    name: "我的应用",
    href: "/my-app",
    icon: MyIcon,
    order: 10
  },
  routes: [/* 路由配置 */],
  hooks: {/* 生命周期钩子 */},
  entry: () => import('./index').then(m => m.default)
};
```

### 状态管理

使用 Zustand 进行状态管理：

```typescript
import { create } from 'zustand';

interface AppState {
  data: any[];
  isLoading: boolean;
  loadData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  data: [],
  isLoading: false,
  loadData: async () => {
    set({ isLoading: true });
    // 加载数据逻辑
    set({ isLoading: false });
  }
}));
```

### 服务层

将业务逻辑封装在服务层：

```typescript
class AppService {
  async getData() {
    // API 调用或数据处理
  }
  
  async saveData(data: any) {
    // 保存数据
  }
}

export const appService = new AppService();
```

## 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0 (或 yarn >= 1.22.0, pnpm >= 7.0.0)

## 故障排除

### 常见问题

**Q: 创建应用时提示权限错误**
A: 确保有写入权限，或者使用 `sudo` 运行命令（不推荐）。

**Q: 开发服务器无法启动**
A: 检查端口是否被占用，使用 `--port` 选项指定其他端口。

**Q: 构建失败**
A: 检查 TypeScript 错误，运行 `magicteam test` 确保代码正确。

**Q: 发布失败**
A: 确保已登录到注册中心，检查网络连接。

### 调试模式

使用 `--debug` 选项获取详细日志：

```bash
magicteam create my-app --debug
magicteam build --debug
```

## 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md)。

## 许可证

MIT License

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新信息。