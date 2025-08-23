/**
 * App Registry Unit Tests
 * 
 * 测试 AppRegistryClient 的基础功能和单个模式的行为
 */

import { AppRegistryClient } from '../../src/plugin/app-registry';

describe('AppRegistryClient Unit Tests', () => {
  
  describe('Constructor and Mode Detection', () => {
    test('should create HTTP mode client correctly', () => {
      const client = new AppRegistryClient('http://localhost:1421');
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(false);
      expect(client.isReady()).toBe(true);
    });

    test('should create Tauri native mode client correctly', () => {
      const client = new AppRegistryClient();
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(true);
      expect(client.isReady()).toBe(true);
    });

    test('should create proxy mode client correctly', () => {
      const mockProxy = {
        getApps: jest.fn(),
        getApp: jest.fn(),
        healthCheck: jest.fn(),
      };
      
      const client = new AppRegistryClient(null, mockProxy);
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
      expect(client.isReady()).toBe(true);
    });
  });

  describe('Method Availability', () => {
    test('should have all required public methods', () => {
      const client = new AppRegistryClient();
      
      // Core methods
      expect(typeof client.getApps).toBe('function');
      expect(typeof client.getApp).toBe('function');
      expect(typeof client.healthCheck).toBe('function');
      
      // Registration methods
      expect(typeof client.registerApp).toBe('function');
      expect(typeof client.devRegisterApp).toBe('function');
      expect(typeof client.uninstallApp).toBe('function');
      
      // State management
      expect(typeof client.activateApp).toBe('function');
      expect(typeof client.deactivateApp).toBe('function');
      expect(typeof client.getActiveApps).toBe('function');
      
      // Bulk operations
      expect(typeof client.bulkActionApps).toBe('function');
      expect(typeof client.bulkActivateApps).toBe('function');
      expect(typeof client.bulkDeactivateApps).toBe('function');
      expect(typeof client.bulkUninstallApps).toBe('function');
      
      // Monitoring
      expect(typeof client.getAppHealth).toBe('function');
      expect(typeof client.getSystemStatus).toBe('function');
      expect(typeof client.getAppStats).toBe('function');
      expect(typeof client.getAppEvents).toBe('function');
      
      // Search and utilities
      expect(typeof client.searchApps).toBe('function');
      expect(typeof client.validateAppConfig).toBe('function');
      expect(typeof client.cleanupAppCache).toBe('function');
      
      // Helper methods
      expect(typeof client.getAppsByStatus).toBe('function');
      expect(typeof client.getAppsByCategory).toBe('function');
      expect(typeof client.appExists).toBe('function');
      expect(typeof client.isAppActive).toBe('function');
      expect(typeof client.waitForAppStatus).toBe('function');
      
      // Lifecycle
      expect(typeof client.cleanup).toBe('function');
    });
  });

  describe('Static Factory Methods', () => {
    test('create method should exist and be async', () => {
      expect(typeof AppRegistryClient.create).toBe('function');
      expect(AppRegistryClient.create()).toBeInstanceOf(Promise);
    });
  });

  describe('Error Handling', () => {
    test('Tauri native mode should fail gracefully in test environment', async () => {
      const client = new AppRegistryClient();
      
      // In test environment, Tauri API is not available
      await expect(client.getApps()).rejects.toThrow(/插件加载失败/);
    });

    test('HTTP mode with invalid URL should fail gracefully', async () => {
      const client = new AppRegistryClient('http://invalid-url-that-does-not-exist:99999');
      
      await expect(client.getApps()).rejects.toThrow();
    });

    test('HTTP mode health check should handle failures', async () => {
      const client = new AppRegistryClient('http://localhost:99999');
      
      const result = await client.healthCheck();
      expect(result.healthy).toBe(false);
      expect(result.message).toContain('Health check failed');
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('Proxy Mode Behavior', () => {
    test('should call proxy methods correctly', async () => {
      const mockProxy = {
        getApps: jest.fn().mockResolvedValue([]),
        getApp: jest.fn().mockResolvedValue(null),
        healthCheck: jest.fn().mockResolvedValue({ healthy: true, message: 'OK', timestamp: Date.now() }),
      };
      
      const client = new AppRegistryClient(null, mockProxy);
      
      // Test getApps
      await client.getApps();
      expect(mockProxy.getApps).toHaveBeenCalledTimes(1);
      
      // Test getApp
      await client.getApp('test-app');
      expect(mockProxy.getApp).toHaveBeenCalledWith('test-app');
      
      // Test healthCheck
      const health = await client.healthCheck();
      expect(mockProxy.healthCheck).toHaveBeenCalledTimes(1);
      expect(health.healthy).toBe(true);
    });

    test('should handle proxy method failures', async () => {
      const mockProxy = {
        getApps: jest.fn().mockRejectedValue(new Error('Proxy error')),
      };
      
      const client = new AppRegistryClient(null, mockProxy);
      
      await expect(client.getApps()).rejects.toThrow('Proxy error');
    });
  });

  describe('Utility Methods', () => {
    test('cleanup should work without throwing', async () => {
      const client = new AppRegistryClient();
      
      await expect(client.cleanup()).resolves.toBeUndefined();
    });

    test('helper methods should delegate to main methods', () => {
      const client = new AppRegistryClient();
      
      // Mock the main methods
      client.getApps = jest.fn().mockResolvedValue([]);
      client.bulkActionApps = jest.fn().mockResolvedValue({ successful: [], failed: [] });
      
      // Test helper methods
      client.getAppsByStatus('active');
      expect(client.getApps).toHaveBeenCalledWith({ status: 'active' });
      
      client.getAppsByCategory('system');
      expect(client.getApps).toHaveBeenCalledWith({ category: 'system' });
      
      client.bulkActivateApps(['app1', 'app2']);
      expect(client.bulkActionApps).toHaveBeenCalledWith('activate', ['app1', 'app2']);
    });
  });
});