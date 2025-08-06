/**
 * WonderKits 统一客户端使用示例
 * 
 * 展示如何使用新的统一客户端管理器，完全替代分散的 initForDevelopment 方法
 * 🚀 简化的 API - 不再需要每个服务独立初始化！
 */

import { 
  WonderKitsClient, 
  createWonderKitsClient, 
  initForDevelopment,
  type ClientServices 
} from '../src/index';

// 💡 方式 1: 使用工厂函数创建客户端
async function example1_FactoryPattern() {
  // 创建统一客户端
  const client = createWonderKitsClient({
    httpPort: 8080,
    verbose: true
  });

  // 配置需要的服务
  const services: ClientServices = {
    sql: {
      connectionString: 'sqlite:app.db'
    },
    store: {
      filename: 'app.store'
    },
    fs: {}
  };

  // 初始化所有服务
  await client.initServices(services);

  // 使用服务
  const database = client.sql();
  const store = client.store();
  const fs = client.fs();

  // 执行操作
  await database.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');
  await store.set('app.version', '1.0.0');
  await fs.writeTextFile('config.json', '{"env": "development"}');

  console.log('✅ 所有服务初始化和使用成功');
}

// 💡 方式 2: 使用便捷的开发初始化函数
async function example2_DevMode() {
  const client = await initForDevelopment({
    sql: { connectionString: 'sqlite:dev.db' },
    store: { filename: 'dev.store' },
    fs: {}
  }, {
    httpPort: 8080
  });

  // 检查哪些服务已初始化
  console.log('已初始化的服务:', client.getInitializedServices());
  console.log('运行模式:', client.getMode());

  // 有条件地使用服务
  if (client.isServiceInitialized('sql')) {
    const result = await client.sql().select('SELECT COUNT(*) as count FROM sqlite_master');
    console.log('数据库表数量:', result.data[0].count);
  }

  if (client.isServiceInitialized('store')) {
    await client.store().set('last_startup', new Date().toISOString());
    const lastStartup = await client.store().get<string>('last_startup');
    console.log('上次启动时间:', lastStartup);
  }
}

// 💡 方式 3: 手动管理客户端生命周期
async function example3_ManualLifecycle() {
  const client = new WonderKitsClient({
    forceMode: 'http', // 强制使用 HTTP 模式
    httpPort: 9000,
    verbose: true
  });

  try {
    // 分阶段初始化服务
    await client.initServices({
      sql: { connectionString: 'sqlite:stage1.db' }
    });

    console.log('第一阶段初始化完成');

    // 后续可以继续初始化其他服务
    await client.initServices({
      store: { filename: 'stage2.store' }
    });

    console.log('第二阶段初始化完成');

    // 使用服务...
    const sql = client.sql();
    const store = client.store();

  } finally {
    // 清理资源
    await client.destroy();
    console.log('客户端已清理');
  }
}

// 💡 方式 4: 环境适配示例
async function example4_EnvironmentAdaptive() {
  const client = createWonderKitsClient({
    verbose: true
    // 不指定模式，让客户端自动检测
  });

  const mode = client.getMode();
  console.log(`自动检测到运行模式: ${mode}`);

  // 根据不同模式配置不同的服务
  const services: ClientServices = {};

  switch (mode) {
    case 'tauri-native':
      // 原生模式可以使用所有服务
      services.sql = { connectionString: 'sqlite:production.db' };
      services.store = { filename: 'production.store' };
      services.fs = {};
      break;

    case 'tauri-proxy':
      // 代理模式依赖主应用提供的服务
      services.sql = { connectionString: 'sqlite:proxy.db' };
      services.store = { filename: 'proxy.store' };
      break;

    case 'http':
      // HTTP 模式适用于开发环境
      services.sql = { connectionString: 'sqlite:dev.db' };
      services.store = { filename: 'dev.store' };
      services.fs = {};
      break;
  }

  await client.initServices(services);
  console.log(`${mode} 模式下服务初始化完成`);
}

// 运行示例
async function runExamples() {
  console.log('🚀 WonderKits 统一客户端示例\n');

  try {
    console.log('📍 示例 1: 工厂模式');
    await example1_FactoryPattern();
    console.log('');

    console.log('📍 示例 2: 开发模式');
    await example2_DevMode();
    console.log('');

    console.log('📍 示例 3: 手动生命周期管理');
    await example3_ManualLifecycle();
    console.log('');

    console.log('📍 示例 4: 环境自适应');
    await example4_EnvironmentAdaptive();
    console.log('');

    console.log('✅ 所有示例运行完成');
  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 导出示例函数以供测试
export {
  example1_FactoryPattern,
  example2_DevMode,
  example3_ManualLifecycle,
  example4_EnvironmentAdaptive,
  runExamples
};

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}