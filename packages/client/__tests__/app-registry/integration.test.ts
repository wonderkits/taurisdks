/**
 * App Registry Integration Tests
 * 
 * 测试与实际运行的 localhost:1421 服务的集成
 * 这些测试需要真实的后端服务运行
 */

import { AppRegistryClient } from '../../src/plugin/app-registry';
import { WonderKitsClient } from '../../src/core/client';

describe('App Registry Integration Tests', () => {
  let isServiceAvailable = false;
  let httpClient: AppRegistryClient;
  let unifiedClient: WonderKitsClient;

  beforeAll(async () => {
    // Check if the backend service is available
    try {
      const response = await fetch('http://localhost:1421/api/health');
      if (response.ok) {
        isServiceAvailable = true;
        httpClient = await AppRegistryClient.create({
          httpBaseUrl: 'http://localhost:1421'
        });
        
        unifiedClient = new WonderKitsClient({
          httpPort: 1421,
          verbose: false
        });
        await unifiedClient.initServices({
          appRegistry: {}
        });
      }
    } catch (error) {
      console.warn('⚠️  Backend service not available at localhost:1421');
      console.warn('   Integration tests will be skipped');
      console.warn('   To run these tests, start the magicteam project with npm run start');
    }
  });

  afterAll(async () => {
    if (unifiedClient) {
      await unifiedClient.destroy();
    }
    if (httpClient) {
      await httpClient.cleanup();
    }
  });

  describe('Service Connectivity', () => {
    test('should connect to backend service', () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      expect(httpClient).toBeDefined();
      expect(httpClient.isHttpMode).toBe(true);
      expect(httpClient.isReady()).toBe(true);
    });

    test('should perform health check successfully', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const result = await httpClient.healthCheck();
      
      expect(result).toHaveProperty('healthy');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.healthy).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('Application Management', () => {
    test('should retrieve application list', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const apps = await httpClient.getApps();
      
      expect(Array.isArray(apps)).toBe(true);
      
      if (apps.length > 0) {
        const app = apps[0];
        expect(app).toHaveProperty('id');
        expect(app).toHaveProperty('name');
        expect(app).toHaveProperty('display_name');
        expect(app).toHaveProperty('version');
        expect(app).toHaveProperty('status');
        expect(app).toHaveProperty('app_type');
        expect(app).toHaveProperty('config_json');
        expect(app).toHaveProperty('created_at');
        expect(app).toHaveProperty('updated_at');
      }
    });

    test('should retrieve individual application', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const apps = await httpClient.getApps();
      if (apps.length > 0) {
        const firstApp = apps[0];
        const app = await httpClient.getApp(firstApp.id);
        
        expect(app).not.toBeNull();
        expect(app?.id).toBe(firstApp.id);
        expect(app?.name).toBe(firstApp.name);
        expect(app?.display_name).toBe(firstApp.display_name);
      }
    });

    test('should return null for non-existent application', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const app = await httpClient.getApp('definitely-non-existent-app-id');
      expect(app).toBeNull();
    });
  });

  describe('Filtering and Querying', () => {
    test('should filter applications by status', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const activeApps = await httpClient.getApps({ status: 'active' });
      expect(Array.isArray(activeApps)).toBe(true);
      
      // All returned apps should have active status
      activeApps.forEach(app => {
        expect(app.status).toBe('active');
      });
    });

    test('should filter applications by category', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const systemApps = await httpClient.getApps({ category: 'system' });
      expect(Array.isArray(systemApps)).toBe(true);
      
      // All returned apps should be system category
      systemApps.forEach(app => {
        expect(app.category).toBe('system');
      });
    });

    test('should support pagination with limit and offset', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const allApps = await httpClient.getApps();
      
      if (allApps.length > 2) {
        const limitedApps = await httpClient.getApps({ limit: 2 });
        expect(limitedApps.length).toBeLessThanOrEqual(2);
        expect(limitedApps.length).toBeGreaterThan(0);
        
        const offsetApps = await httpClient.getApps({ offset: 1 });
        expect(offsetApps.length).toBe(allApps.length - 1);
      }
    });

    test('should use helper methods correctly', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const activeApps = await httpClient.getAppsByStatus('active');
      const systemApps = await httpClient.getAppsByCategory('system');
      
      expect(Array.isArray(activeApps)).toBe(true);
      expect(Array.isArray(systemApps)).toBe(true);
      
      activeApps.forEach(app => expect(app.status).toBe('active'));
      systemApps.forEach(app => expect(app.category).toBe('system'));
    });
  });

  describe('Application State Checking', () => {
    test('should check if applications exist', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const apps = await httpClient.getApps();
      
      if (apps.length > 0) {
        const firstApp = apps[0];
        const exists = await httpClient.appExists(firstApp.id);
        expect(exists).toBe(true);
      }
      
      const doesNotExist = await httpClient.appExists('definitely-non-existent-app');
      expect(doesNotExist).toBe(false);
    });

    test('should check application active status', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const activeApps = await httpClient.getAppsByStatus('active');
      
      if (activeApps.length > 0) {
        const activeApp = activeApps[0];
        const isActive = await httpClient.isAppActive(activeApp.id);
        expect(isActive).toBe(true);
      }
    });
  });

  describe('Unified Client Integration', () => {
    test('should work through WonderKitsClient', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      expect(unifiedClient.isServiceInitialized('appRegistry')).toBe(true);
      
      const appRegistryClient = unifiedClient.appRegistry();
      expect(appRegistryClient).toBeDefined();
      expect(appRegistryClient.isHttpMode).toBe(true);
      
      // Test basic functionality through unified client
      const apps = await appRegistryClient.getApps();
      expect(Array.isArray(apps)).toBe(true);
    });

    test('should maintain service lifecycle', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const services = unifiedClient.getInitializedServices();
      expect(services).toContain('appRegistry');
      
      const diagnostics = await unifiedClient.getConnectionDiagnostics();
      expect(diagnostics).toContain('连接正常');
    });
  });

  describe('Data Validation', () => {
    test('should return properly formatted application data', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const apps = await httpClient.getApps();
      
      if (apps.length > 0) {
        const app = apps[0];
        
        // Validate required fields and their types
        expect(typeof app.id).toBe('string');
        expect(typeof app.name).toBe('string');
        expect(typeof app.display_name).toBe('string');
        expect(typeof app.version).toBe('string');
        expect(typeof app.status).toBe('string');
        expect(typeof app.app_type).toBe('string');
        expect(typeof app.config_json).toBe('string');
        expect(typeof app.created_at).toBe('string');
        expect(typeof app.updated_at).toBe('string');
        
        // Validate that config_json is valid JSON
        expect(() => JSON.parse(app.config_json)).not.toThrow();
        
        // Validate date formats
        expect(new Date(app.created_at).toString()).not.toBe('Invalid Date');
        expect(new Date(app.updated_at).toString()).not.toBe('Invalid Date');
      }
    });
  });

  describe('Performance', () => {
    test('should handle concurrent requests', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      // Test multiple concurrent requests
      const promises = [
        httpClient.getApps(),
        httpClient.getApps({ status: 'active' }),
        httpClient.getApps({ category: 'system' }),
        httpClient.healthCheck(),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(4);
      expect(Array.isArray(results[0])).toBe(true);
      expect(Array.isArray(results[1])).toBe(true);
      expect(Array.isArray(results[2])).toBe(true);
      expect(results[3]).toHaveProperty('healthy');
    }, 10000);

    test('should have reasonable response times', async () => {
      if (!isServiceAvailable) {
        pending('Backend service not available');
        return;
      }

      const startTime = Date.now();
      await httpClient.getApps();
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});