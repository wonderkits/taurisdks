/**
 * App Registry 客户端集成示例
 * 
 * 展示如何使用 AppRegistryClient 进行应用管理
 */

import { 
  AppRegistryClient,
  AppConfig,
  RegisteredApp,
  AppHealthStatus,
  SystemStatus 
} from '../src/plugin/app-registry';

// 创建客户端实例
const appRegistryClient = new AppRegistryClient();

// ============================================================================
// 基础使用示例
// ============================================================================

/**
 * 基本应用管理示例
 */
export async function basicAppManagementExample() {
  console.log('🚀 开始应用管理示例...');
  
  try {
    // 1. 获取所有应用
    const apps = await appRegistryClient.getApps();
    console.log('📱 当前应用列表:', apps.length, '个应用');
    
    // 2. 获取活跃应用
    const activeApps = await appRegistryClient.getActiveApps();
    console.log('✅ 活跃应用:', activeApps.length, '个');
    
    // 3. 获取系统状态
    const systemStatus = await appRegistryClient.getSystemStatus();
    console.log('📊 系统状态:', {
      total: systemStatus.total_apps,
      active: systemStatus.active_apps,
      uptime: systemStatus.uptime
    });
    
    // 4. 检查特定应用
    const appExists = await appRegistryClient.appExists('test-app');
    console.log('🔍 test-app 是否存在:', appExists);
    
  } catch (error) {
    console.error('❌ 应用管理示例失败:', error);
  }
}

/**
 * 应用注册示例
 */
export async function appRegistrationExample() {
  console.log('📝 开始应用注册示例...');
  
  const sampleAppConfig: AppConfig = {
    manifest: {
      id: 'sample-app',
      name: 'sample',
      displayName: 'Sample Application',
      version: '1.0.0',
      description: '这是一个示例应用',
      author: 'Developer',
      category: 'tools'
    },
    navigation: {
      name: '示例应用',
      href: '/sample-app',
      order: 10
    },
    routes: [
      {
        path: '/sample-app',
        component: 'SampleAppComponent'
      }
    ],
    hooks: {
      onActivate: 'handleActivate',
      onDeactivate: 'handleDeactivate'
    }
  };
  
  try {
    // 1. 验证配置
    const validation = await appRegistryClient.validateAppConfig(sampleAppConfig);
    console.log('✅ 配置验证结果:', validation.valid ? '通过' : '失败');
    
    if (!validation.valid) {
      console.error('❌ 配置错误:', validation.errors);
      return;
    }
    
    // 2. 注册应用
    const appId = await appRegistryClient.registerApp(sampleAppConfig);
    console.log('📱 应用注册成功，ID:', appId);
    
    // 3. 激活应用
    await appRegistryClient.activateApp(appId);
    console.log('✅ 应用激活成功');
    
    // 4. 检查应用状态
    const isActive = await appRegistryClient.isAppActive(appId);
    console.log('🔍 应用是否活跃:', isActive);
    
    // 5. 获取应用详情
    const app = await appRegistryClient.getApp(appId);
    console.log('📋 应用详情:', {
      name: app?.display_name,
      status: app?.status,
      version: app?.version
    });
    
  } catch (error) {
    console.error('❌ 应用注册示例失败:', error);
  }
}

/**
 * 开发环境应用注册示例
 */
export async function devAppRegistrationExample() {
  console.log('🛠️ 开始开发环境应用注册示例...');
  
  const devAppConfig: AppConfig = {
    manifest: {
      id: 'dev-app',
      name: 'dev-app',
      displayName: 'Development App',
      version: '0.1.0-dev',
      description: '开发环境测试应用'
    }
  };
  
  try {
    // 开发环境注册（支持热更新）
    const result = await appRegistryClient.devRegisterApp(
      devAppConfig, 
      'http://localhost:3001'
    );
    
    console.log('🛠️ 开发应用注册结果:', {
      appId: result.app_id,
      action: result.action // "created" 或 "updated"
    });
    
    // 获取开发应用详情
    const devApp = await appRegistryClient.getApp(result.app_id);
    console.log('📱 开发应用详情:', {
      name: devApp?.display_name,
      devUrl: devApp?.dev_url,
      status: devApp?.status
    });
    
  } catch (error) {
    console.error('❌ 开发环境应用注册失败:', error);
  }
}

/**
 * 批量操作示例
 */
export async function bulkOperationsExample() {
  console.log('📦 开始批量操作示例...');
  
  try {
    // 1. 获取所有非活跃应用
    const inactiveApps = await appRegistryClient.getAppsByStatus('inactive');
    const appIds = inactiveApps.map(app => app.id);
    
    if (appIds.length === 0) {
      console.log('ℹ️ 没有非活跃应用可操作');
      return;
    }
    
    console.log('📋 找到', appIds.length, '个非活跃应用');
    
    // 2. 批量激活前3个应用
    const targetIds = appIds.slice(0, 3);
    const activateResult = await appRegistryClient.bulkActivateApps(targetIds);
    
    console.log('✅ 批量激活结果:', {
      成功: activateResult.successful.length,
      失败: activateResult.failed.length
    });
    
    if (activateResult.failed.length > 0) {
      console.log('❌ 激活失败的应用:', activateResult.failed);
    }
    
    // 3. 等待一段时间后批量停用
    setTimeout(async () => {
      try {
        const deactivateResult = await appRegistryClient.bulkDeactivateApps(
          activateResult.successful
        );
        
        console.log('⏹️ 批量停用结果:', {
          成功: deactivateResult.successful.length,
          失败: deactivateResult.failed.length
        });
        
      } catch (error) {
        console.error('❌ 批量停用失败:', error);
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ 批量操作示例失败:', error);
  }
}

/**
 * 应用监控示例
 */
export async function appMonitoringExample() {
  console.log('📊 开始应用监控示例...');
  
  try {
    // 1. 获取活跃应用列表
    const activeApps = await appRegistryClient.getActiveApps();
    console.log('👀 监控', activeApps.length, '个活跃应用');
    
    // 2. 检查每个应用的健康状态
    const healthChecks = await Promise.allSettled(
      activeApps.map(app => appRegistryClient.getAppHealth(app.id))
    );
    
    const healthStatuses: AppHealthStatus[] = [];
    healthChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        healthStatuses.push(result.value);
      } else {
        console.error(`❌ 应用 ${activeApps[index].id} 健康检查失败:`, result.reason);
      }
    });
    
    // 3. 统计健康状态
    const healthStats = healthStatuses.reduce((acc, status) => {
      acc[status.status] = (acc[status.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('💊 应用健康统计:', healthStats);
    
    // 4. 获取应用统计信息
    const appStats = await appRegistryClient.getAppStats();
    console.log('📈 应用统计:', {
      总数: appStats.total,
      按状态: appStats.by_status,
      按分类: appStats.by_category
    });
    
    // 5. 获取系统健康检查
    const systemHealth = await appRegistryClient.healthCheck();
    console.log('🏥 系统健康:', {
      健康: systemHealth.healthy,
      消息: systemHealth.message
    });
    
  } catch (error) {
    console.error('❌ 应用监控示例失败:', error);
  }
}

/**
 * 应用搜索示例
 */
export async function appSearchExample() {
  console.log('🔍 开始应用搜索示例...');
  
  try {
    // 1. 基础文本搜索
    const searchResults = await appRegistryClient.searchApps('test');
    console.log('🔍 搜索 "test" 结果:', searchResults.length, '个应用');
    
    // 2. 带过滤器的搜索
    const filteredResults = await appRegistryClient.searchApps('', {
      status: 'active',
      category: 'tools'
    });
    console.log('🔍 过滤器搜索结果:', filteredResults.length, '个应用');
    
    // 3. 按分类获取应用
    const toolsApps = await appRegistryClient.getAppsByCategory('tools');
    console.log('🛠️ 工具类应用:', toolsApps.length, '个');
    
    // 4. 获取指定状态的应用
    const errorApps = await appRegistryClient.getAppsByStatus('error');
    console.log('❌ 错误状态应用:', errorApps.length, '个');
    
    if (errorApps.length > 0) {
      console.log('⚠️ 错误应用详情:');
      errorApps.forEach(app => {
        console.log(`  - ${app.display_name}: ${app.error_message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 应用搜索示例失败:', error);
  }
}

/**
 * 应用事件监控示例
 */
export async function appEventsExample() {
  console.log('📋 开始应用事件监控示例...');
  
  try {
    // 获取所有应用
    const apps = await appRegistryClient.getApps({ limit: 5 });
    
    if (apps.length === 0) {
      console.log('ℹ️ 没有应用可监控事件');
      return;
    }
    
    // 获取每个应用的最近事件
    for (const app of apps) {
      try {
        const events = await appRegistryClient.getAppEvents(app.id, 3);
        
        if (events.length > 0) {
          console.log(`📱 应用 ${app.display_name} 的最近事件:`);
          events.forEach(event => {
            console.log(`  📅 ${event.created_at}: ${event.event_type}`);
            if (event.event_data) {
              console.log(`     数据: ${event.event_data}`);
            }
          });
        }
      } catch (error) {
        console.error(`❌ 获取应用 ${app.id} 事件失败:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ 应用事件监控示例失败:', error);
  }
}

/**
 * 高级功能示例
 */
export async function advancedFeaturesExample() {
  console.log('🚀 开始高级功能示例...');
  
  try {
    // 1. 等待应用状态变化
    const apps = await appRegistryClient.getApps({ limit: 1 });
    if (apps.length > 0) {
      const app = apps[0];
      console.log(`⏳ 等待应用 ${app.display_name} 状态变化...`);
      
      // 假设在其他地方会改变应用状态
      // 这里只是演示 API 用法
      const statusChanged = await appRegistryClient.waitForAppStatus(
        app.id, 
        'active', 
        10000 // 10秒超时
      );
      
      console.log('📈 状态变化结果:', statusChanged ? '成功' : '超时');
    }
    
    // 2. 清理应用缓存
    await appRegistryClient.cleanupAppCache();
    console.log('🧹 所有应用缓存清理完成');
    
    // 3. 清理特定应用缓存
    if (apps.length > 0) {
      await appRegistryClient.cleanupAppCache(apps[0].id);
      console.log(`🧹 应用 ${apps[0].display_name} 缓存清理完成`);
    }
    
  } catch (error) {
    console.error('❌ 高级功能示例失败:', error);
  }
}

/**
 * 完整应用生命周期示例
 */
export async function completeLifecycleExample() {
  console.log('♻️ 开始完整应用生命周期示例...');
  
  const lifecycleAppConfig: AppConfig = {
    manifest: {
      id: 'lifecycle-demo',
      name: 'lifecycle',
      displayName: 'Lifecycle Demo',
      version: '1.0.0',
      description: '生命周期演示应用'
    }
  };
  
  try {
    console.log('1️⃣ 注册应用...');
    const appId = await appRegistryClient.registerApp(lifecycleAppConfig);
    
    console.log('2️⃣ 激活应用...');
    await appRegistryClient.activateApp(appId);
    
    console.log('3️⃣ 检查健康状态...');
    const health = await appRegistryClient.getAppHealth(appId);
    console.log('   健康状态:', health.status);
    
    console.log('4️⃣ 获取应用事件...');
    const events = await appRegistryClient.getAppEvents(appId, 5);
    console.log('   事件数量:', events.length);
    
    console.log('5️⃣ 停用应用...');
    await appRegistryClient.deactivateApp(appId);
    
    console.log('6️⃣ 卸载应用...');
    await appRegistryClient.uninstallApp(appId);
    
    console.log('✅ 完整生命周期演示完成');
    
  } catch (error) {
    console.error('❌ 生命周期示例失败:', error);
  }
}

// ============================================================================
// 运行所有示例
// ============================================================================

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('🎬 开始运行所有 App Registry 示例...\n');
  
  const examples = [
    { name: '基础应用管理', fn: basicAppManagementExample },
    { name: '应用注册', fn: appRegistrationExample },
    { name: '开发环境注册', fn: devAppRegistrationExample },
    { name: '批量操作', fn: bulkOperationsExample },
    { name: '应用监控', fn: appMonitoringExample },
    { name: '应用搜索', fn: appSearchExample },
    { name: '事件监控', fn: appEventsExample },
    { name: '高级功能', fn: advancedFeaturesExample },
    { name: '完整生命周期', fn: completeLifecycleExample }
  ];
  
  for (const example of examples) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📋 ${example.name} 示例`);
      console.log(`${'='.repeat(50)}`);
      
      await example.fn();
      
      console.log(`✅ ${example.name} 示例完成`);
      
    } catch (error) {
      console.error(`❌ ${example.name} 示例失败:`, error);
    }
    
    // 示例之间等待一段时间
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 所有示例运行完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error);
}