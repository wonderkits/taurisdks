/**
 * Core Domain - 核心领域
 *
 * 提供统一的客户端管理、类型定义和核心工具函数
 */

export { WonderKitsClient, createWonderKitsClient, initForDevelopment } from './client';

export type { WonderKitsClientConfig, ClientServices } from './client';

export type * from './types';

export { environmentDetector, logger } from './utils';

export * from './wujie';
