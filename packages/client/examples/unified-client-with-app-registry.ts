/**
 * WonderKits 统一客户端 + App Registry 使用示例
 * 
 * 展示如何通过统一的 client 调用各个服务，包括新的 App Registry
 */

import { createWonderKitsClient, initForDevelopment } from '../src/core/client';
import type { AppConfig } from '../src/plugin/app-registry';

// ============================================================================
// 基础使用示例 - 通过统一客户端访问所有服务
// ============================================================================

/**
 * 统一客户端基础使用示例
 */
export async function unifiedClientBasicExample() {
  console.log('🚀 开始统一客户端基础示例...');

  try {
    // 1. 创建统一客户端
    const client = createWonderKitsClient({
      verbose: true,
      httpPort: 1421
    });

    // 2. 初始化所有服务
    await client.initServices({
      sql: {
        connectionString: 'sqlite:app.db',
      },
      store: {
        filename: 'settings.json'
      },
      fs: {},
      appRegistry: {}  // App Registry 服务
    });

    // 3. 使用各个服务
    console.log('📱 App Registry 服务测试:');
    const appRegistry = client.appRegistry();
    
    const apps = await appRegistry.getApps();
    console.log(`找到 ${apps.length} 个应用`);
    
    const systemStatus = await appRegistry.getSystemStatus();
    console.log('系统状态:', {
      totalApps: systemStatus.total_apps,
      activeApps: systemStatus.active_apps
    });

    console.log('💾 SQL 服务测试:');
    const database = client.sql();
    // SQL 操作...

    console.log('📦 Store 服务测试:');
    const store = client.store();
    // Store 操作...

    console.log('📁 FS 服务测试:');
    const fs = client.fs();
    // FS 操作...

    console.log('✅ 所有服务正常工作!');

  } catch (error) {
    console.error('❌ 统一客户端示例失败:', error);
  }
}

/**
 * 开发环境快速初始化示例
 */
export async function developmentInitExample() {
  console.log('🛠️ 开始开发环境快速初始化示例...');

  try {
    // 使用 initForDevelopment 快速初始化所有服务
    const client = await initForDevelopment({
      sql: {
        connectionString: 'sqlite:dev.db'
      },
      store: {
        filename: 'dev-settings.json'
      },
      fs: {},
      appRegistry: {}
    }, {
      verbose: true,
      httpPort: 1421
    });

    console.log('✅ 开发环境初始化完成!');
    
    // 检查所有服务状态
    const initializedServices = client.getInitializedServices();
    console.log('已初始化的服务:', initializedServices);

    // 测试 App Registry
    const appRegistry = client.appRegistry();
    const healthCheck = await appRegistry.healthCheck();
    console.log('App Registry 健康检查:', healthCheck);

  } catch (error) {
    console.error('❌ 开发环境初始化失败:', error);
  }
}

// ============================================================================
// 应用管理工作流示例
// ============================================================================

/**
 * 完整的应用管理工作流
 */
export async function appManagementWorkflowExample() {
  console.log('📱 开始应用管理工作流示例...');

  try {
    // 初始化客户端
    const client = await initForDevelopment({
      appRegistry: {},
      store: { filename: 'app-metadata.json' }
    });

    const appRegistry = client.appRegistry();
    const store = client.store();

    // 1. 注册一个新应用
    const newAppConfig: AppConfig = {
      manifest: {
        id: 'workflow-demo',
        name: 'workflow-demo',
        displayName: 'Workflow Demo App',
        version: '1.0.0',
        description: '工作流演示应用',
        category: 'demo'
      },
      navigation: {
        name: 'Workflow Demo',
        href: '/workflow-demo',
        order: 100
      }
    };

    console.log('1️⃣ 注册新应用...');
    const appId = await appRegistry.registerApp(newAppConfig);
    console.log('应用注册成功:', appId);

    // 2. 将应用信息保存到 Store
    console.log('2️⃣ 保存应用元数据到 Store...');
    await store.set(`app_metadata_${appId}`, {
      registeredAt: new Date().toISOString(),
      source: 'workflow-demo',
      tags: ['demo', 'workflow']
    });

    // 3. 激活应用
    console.log('3️⃣ 激活应用...');
    await appRegistry.activateApp(appId);

    // 4. 检查应用状态
    console.log('4️⃣ 检查应用状态...');
    const appHealth = await appRegistry.getAppHealth(appId);
    console.log('应用健康状态:', appHealth.status);

    // 5. 获取应用事件
    console.log('5️⃣ 获取应用事件...');
    const events = await appRegistry.getAppEvents(appId, 5);
    console.log(`应用事件数量: ${events.length}`);
    events.forEach(event => {
      console.log(`  - ${event.created_at}: ${event.event_type}`);
    });

    // 6. 从 Store 获取应用元数据
    console.log('6️⃣ 获取应用元数据...');
    const metadata = await store.get(`app_metadata_${appId}`);
    console.log('应用元数据:', metadata);

    // 7. 系统统计
    console.log('7️⃣ 系统统计...');
    const stats = await appRegistry.getAppStats();
    console.log('系统统计:', {
      总应用数: stats.total,
      按状态分布: stats.by_status,
      按分类分布: stats.by_category
    });

    console.log('✅ 应用管理工作流完成!');

  } catch (error) {
    console.error('❌ 应用管理工作流失败:', error);
  }
}

// ============================================================================
// 批量操作示例
// ============================================================================

/**
 * 批量操作示例
 */
export async function batchOperationsExample() {
  console.log('📦 开始批量操作示例...');

  try {
    const client = await initForDevelopment({
      appRegistry: {}
    });

    const appRegistry = client.appRegistry();

    // 1. 创建多个测试应用
    console.log('1️⃣ 创建多个测试应用...');
    const testApps: AppConfig[] = [
      {
        manifest: {
          id: 'batch-test-1',
          name: 'batch-test-1',
          displayName: 'Batch Test App 1',
          version: '1.0.0',
          category: 'test'
        }
      },
      {
        manifest: {
          id: 'batch-test-2',
          name: 'batch-test-2',
          displayName: 'Batch Test App 2',
          version: '1.0.0',
          category: 'test'
        }
      },
      {
        manifest: {
          id: 'batch-test-3',
          name: 'batch-test-3',
          displayName: 'Batch Test App 3',
          version: '1.0.0',
          category: 'test'
        }
      }
    ];

    const registeredAppIds: string[] = [];
    for (const appConfig of testApps) {
      const appId = await appRegistry.registerApp(appConfig);
      registeredAppIds.push(appId);
    }

    console.log('创建的应用 IDs:', registeredAppIds);

    // 2. 批量激活
    console.log('2️⃣ 批量激活应用...');
    const activateResult = await appRegistry.bulkActivateApps(registeredAppIds);
    console.log('批量激活结果:', {
      成功: activateResult.successful.length,
      失败: activateResult.failed.length
    });

    // 3. 检查活跃应用
    console.log('3️⃣ 检查活跃应用...');
    const activeApps = await appRegistry.getActiveApps();
    const testActiveApps = activeApps.filter(app => app.category === 'test');
    console.log(`测试分类下的活跃应用: ${testActiveApps.length} 个`);

    // 4. 等待一段时间，然后批量停用
    console.log('4️⃣ 等待2秒后批量停用...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const deactivateResult = await appRegistry.bulkDeactivateApps(registeredAppIds);
    console.log('批量停用结果:', {
      成功: deactivateResult.successful.length,
      失败: deactivateResult.failed.length
    });

    // 5. 批量卸载
    console.log('5️⃣ 批量卸载应用...');
    const uninstallResult = await appRegistry.bulkUninstallApps(registeredAppIds);
    console.log('批量卸载结果:', {
      成功: uninstallResult.successful.length,
      失败: uninstallResult.failed.length
    });

    console.log('✅ 批量操作示例完成!');

  } catch (error) {
    console.error('❌ 批量操作示例失败:', error);
  }
}

// ============================================================================
// 服务检查和诊断示例
// ============================================================================

/**
 * 服务检查和诊断示例
 */
export async function serviceHealthCheckExample() {
  console.log('🏥 开始服务健康检查示例...');

  try {
    // 创建客户端但不初始化所有服务
    const client = createWonderKitsClient({
      verbose: true
    });

    // 1. 检查连接状态
    console.log('1️⃣ 检查连接状态...');
    const isConnected = await client.checkConnection();
    console.log('连接状态:', isConnected ? '✅ 已连接' : '❌ 未连接');

    // 2. 获取连接诊断信息
    console.log('2️⃣ 获取连接诊断信息...');
    const diagnostics = await client.getConnectionDiagnostics();
    console.log('诊断信息:', diagnostics);

    // 3. 仅初始化 App Registry 服务
    console.log('3️⃣ 初始化 App Registry 服务...');
    await client.initServices({
      appRegistry: {}
    });

    // 4. 检查服务初始化状态
    console.log('4️⃣ 检查服务初始化状态...');
    const services = ['sql', 'store', 'fs', 'appRegistry'] as const;
    services.forEach(service => {
      const isInit = client.isServiceInitialized(service);
      console.log(`${service} 服务: ${isInit ? '✅ 已初始化' : '❌ 未初始化'}`);
    });

    // 5. App Registry 健康检查
    console.log('5️⃣ App Registry 健康检查...');
    const appRegistry = client.appRegistry();
    const healthCheck = await appRegistry.healthCheck();
    console.log('健康检查结果:', {
      健康状态: healthCheck.healthy ? '✅ 健康' : '❌ 不健康',
      消息: healthCheck.message,
      时间戳: new Date(healthCheck.timestamp * 1000).toISOString()
    });

    // 6. 获取系统状态
    console.log('6️⃣ 获取系统状态...');
    const systemStatus = await appRegistry.getSystemStatus();
    console.log('系统状态:', {
      系统版本: systemStatus.system_version,
      运行时间: Math.floor(systemStatus.uptime / 60) + ' 分钟',
      总应用数: systemStatus.total_apps,
      活跃应用数: systemStatus.active_apps
    });

    console.log('✅ 服务健康检查完成!');

  } catch (error) {
    console.error('❌ 服务健康检查失败:', error);
  }
}

// ============================================================================
// 运行所有示例
// ============================================================================

/**
 * 运行所有统一客户端示例
 */
export async function runAllUnifiedClientExamples() {
  console.log('🎬 开始运行所有统一客户端示例...\n');

  const examples = [
    { name: '统一客户端基础使用', fn: unifiedClientBasicExample },
    { name: '开发环境快速初始化', fn: developmentInitExample },
    { name: '应用管理工作流', fn: appManagementWorkflowExample },
    { name: '批量操作', fn: batchOperationsExample },
    { name: '服务健康检查', fn: serviceHealthCheckExample }
  ];

  for (const example of examples) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 ${example.name} 示例`);
      console.log(`${'='.repeat(60)}`);

      await example.fn();

      console.log(`✅ ${example.name} 示例完成`);

    } catch (error) {
      console.error(`❌ ${example.name} 示例失败:`, error);
    }

    // 示例之间等待一段时间
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 所有统一客户端示例运行完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllUnifiedClientExamples().catch(console.error);
}

// ============================================================================
// 使用方法总结
// ============================================================================

/**
 * 使用方法总结
 * 
 * 1. 基础用法 - 通过统一客户端：
 * ```typescript
 * const client = createWonderKitsClient();
 * await client.initServices({ appRegistry: {} });
 * const appRegistry = client.appRegistry();
 * ```
 * 
 * 2. 开发环境快速初始化：
 * ```typescript
 * const client = await initForDevelopment({
 *   sql: { connectionString: 'sqlite:app.db' },
 *   store: { filename: 'settings.json' },
 *   fs: {},
 *   appRegistry: {}
 * });
 * ```
 * 
 * 3. 单独使用 App Registry：
 * ```typescript
 * import { AppRegistryClient } from '@wonderkits/client/plugin';
 * const appRegistry = new AppRegistryClient();
 * ```
 * 
 * 4. React Hook 使用：
 * ```typescript
 * import { useApps, useAppRegistration } from '@wonderkits/client/react';
 * const { apps, loading } = useApps({ autoRefresh: true });
 * ```
 */