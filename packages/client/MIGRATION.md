# 迁移指南：从分散客户端到统一客户端

## 🎯 迁移概述

WonderKits Client v1.0.0 引入了统一客户端管理器，简化了 API 并消除了重复的 `initForDevelopment` 方法。

## 📝 API 变化

### ❌ 旧方式（已移除）
```typescript
// 分别初始化每个服务
const sql = await Database.loadForDevelopment('sqlite:app.db', 8080);
const store = await Store.loadForDevelopment('app.store', 8080);  
const fs = await FsClient.initForDevelopment(8080);
```

### ✅ 新方式（推荐）
```typescript
// 统一管理所有服务
import { initForDevelopment } from '@wonderkits/client';

const client = await initForDevelopment({
  sql: { connectionString: 'sqlite:app.db' },
  store: { filename: 'app.store' },
  fs: {}
}, { 
  httpPort: 8080,
  verbose: true 
});

const sql = client.sql();
const store = client.store();
const fs = client.fs();
```

## 🔧 迁移步骤

### 1. 更新导入
```typescript
// 之前
import { Database, Store, FsClient } from '@wonderkits/client';

// 现在
import { initForDevelopment } from '@wonderkits/client';
```

### 2. 替换初始化逻辑
```typescript
// 之前：多个独立初始化
async function initClients() {
  const sql = await Database.loadForDevelopment('sqlite:app.db');
  const store = await Store.loadForDevelopment('app.store');
  const fs = await FsClient.initForDevelopment();
  
  return { sql, store, fs };
}

// 现在：统一初始化
async function initClients() {
  const client = await initForDevelopment({
    sql: { connectionString: 'sqlite:app.db' },
    store: { filename: 'app.store' },
    fs: {}
  });
  
  return {
    sql: client.sql(),
    store: client.store(),
    fs: client.fs()
  };
}
```

### 3. 错误处理简化
```typescript
// 之前：每个服务单独处理错误
try {
  const sql = await Database.loadForDevelopment('sqlite:app.db');
} catch (sqlError) {
  console.error('SQL 初始化失败:', sqlError);
}

try {
  const store = await Store.loadForDevelopment('app.store');
} catch (storeError) {
  console.error('Store 初始化失败:', storeError);
}

// 现在：统一错误处理
try {
  const client = await initForDevelopment({
    sql: { connectionString: 'sqlite:app.db' },
    store: { filename: 'app.store' },
    fs: {}
  });
} catch (error) {
  console.error('客户端初始化失败:', error);
}
```

## 🆕 新功能

### 环境检测和自适应
```typescript
const client = await initForDevelopment({
  sql: { connectionString: 'sqlite:app.db' },
  store: { filename: 'app.store' },
  fs: {}
});

console.log('运行模式:', client.getMode());
console.log('已初始化服务:', client.getInitializedServices());
```

### 条件服务初始化
```typescript
// 根据需要初始化特定服务
const client = await initForDevelopment({
  // 只初始化 SQL 和 Store
  sql: { connectionString: 'sqlite:app.db' },
  store: { filename: 'app.store' }
  // 不初始化 FS
});

if (client.isServiceInitialized('sql')) {
  const result = await client.sql().select('SELECT * FROM users');
}
```

### 资源管理
```typescript
const client = await initForDevelopment({...});

try {
  // 使用服务...
} finally {
  // 清理资源
  await client.destroy();
}
```

## 🔄 向后兼容

独立的客户端类仍然可用，但不再包含 `*ForDevelopment` 方法：

```typescript
// 仍然可用
import { Database, Store, FsClient } from '@wonderkits/client';

const sql = await Database.load('sqlite:app.db');
const store = await Store.load('app.store');
const fs = await FsClient.init();
```

## 💡 最佳实践

1. **使用统一客户端**: 优先使用 `initForDevelopment` 或 `createWonderKitsClient`
2. **环境自适应**: 让客户端自动检测运行环境，不强制指定模式
3. **错误处理**: 利用统一的错误处理机制
4. **资源清理**: 在应用结束时调用 `client.destroy()`
5. **条件初始化**: 只初始化应用实际需要的服务

## 🚀 迁移收益

- ✅ **API 简化**: 一次调用初始化所有服务
- ✅ **代码减少**: 消除重复的初始化逻辑
- ✅ **错误处理**: 统一的错误处理和日志
- ✅ **环境检测**: 智能的环境适应
- ✅ **资源管理**: 统一的生命周期管理
- ✅ **类型安全**: 更好的 TypeScript 支持