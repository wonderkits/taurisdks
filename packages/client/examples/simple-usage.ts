/**
 * WonderKits 简化使用示例
 * 使用极简全局管理替代复杂的 React 状态管理
 */

import { 
  initWonderKits, 
  getWonderKitsClient, 
  getSql, 
  getStore, 
  getFs, 
  getAppRegistry,
  isWonderKitsInitialized,
  resetWonderKits 
} from '../src/index';

async function main() {
  console.log('🚀 测试简化的 WonderKits 客户端');

  // 检查初始化状态
  console.log('初始化状态:', isWonderKitsInitialized()); // false

  // 初始化所有服务
  console.log('正在初始化...');
  const client = await initWonderKits({
    services: {
      sql: { connectionString: 'sqlite:example.db' },
      store: { filename: 'example.json' },
      fs: true,
      appRegistry: true
    },
    verbose: true
  });

  console.log('初始化完成！客户端:', client.getMode());
  console.log('初始化状态:', isWonderKitsInitialized()); // true

  // 直接使用全局客户端
  const globalClient = getWonderKitsClient();
  console.log('运行模式:', globalClient.getMode());

  // 使用便捷函数获取各个服务
  try {
    const sql = getSql();
    console.log('SQL 客户端可用');
  } catch (e) {
    console.log('SQL 客户端不可用:', e.message);
  }

  try {
    const store = getStore();
    console.log('Store 客户端可用');
  } catch (e) {
    console.log('Store 客户端不可用:', e.message);
  }

  try {
    const fs = getFs();
    console.log('FS 客户端可用');
  } catch (e) {
    console.log('FS 客户端不可用:', e.message);
  }

  try {
    const appRegistry = getAppRegistry();
    console.log('AppRegistry 客户端可用');
  } catch (e) {
    console.log('AppRegistry 客户端不可用:', e.message);
  }

  // 重复初始化测试（应该返回现有实例）
  console.log('\n测试重复初始化...');
  const client2 = await initWonderKits();
  console.log('重复初始化返回相同实例:', client === client2);

  // 重置（仅用于测试）
  resetWonderKits();
  console.log('重置后状态:', isWonderKitsInitialized()); // false
}

// React hooks 示例（在 React 项目中使用）
export const useWonderKits = () => getWonderKitsClient();
export const useSql = () => getSql();
export const useStore = () => getStore();
export const useFs = () => getFs();
export const useAppRegistry = () => getAppRegistry();

// 直接运行示例
main().catch(console.error);