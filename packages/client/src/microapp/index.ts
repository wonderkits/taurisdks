/**
 * Microapp Domain - 微应用领域
 * 
 * 提供应用配置、微应用管理和 Wujie 集成功能
 */

export type * from './app';
export type * from './microApp';

export {
  WujieUtils,
  WujieAppManager,
  createWujieApp,
  type WujieAppInfo,
  type WujieConfig
} from './wujie';