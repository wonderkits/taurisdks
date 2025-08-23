/**
 * React Framework Integration Tests
 * 
 * 测试与实际运行的 localhost:1420 服务的集成
 * 这些测试需要真实的后端服务运行
 */

import { createWonderKitsStore, useWonderKitsStore } from '../../src/framework/react/store';
import { initWonderKits, type WonderKitsReactConfig } from '../../src/framework/react/hooks';
import { WonderKitsClient } from '../../src/core/client';

describe('React Framework Integration Tests', () => {
  let isServiceAvailable = false;
  let unifiedClient: WonderKitsClient;

  beforeAll(async () => {
    // Check if the backend service is available
    try {
      const response = await fetch('http://localhost:1420/api/health');
      if (response.ok) {
        isServiceAvailable = true;
        
        unifiedClient = new WonderKitsClient({
          httpPort: 1420,
          verbose: false
        });
      }
    } catch (error) {
      console.log('Backend service not available, skipping integration tests');
    }
  });

  afterAll(async () => {
    if (unifiedClient) {
      await unifiedClient.destroy();
    }
  });

  beforeEach(() => {
    if (isServiceAvailable) {
      useWonderKitsStore.getState().reset();
    }
  });

  describe('Full Stack Integration', () => {
    test('should initialize with real backend service', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      const config: WonderKitsReactConfig = {
        services: {
          fs: true,
          store: { filename: 'integration-test.json' },
          sql: { connectionString: 'sqlite:integration-test.db' },
          appRegistry: true
        },
        httpPort: 1420,
        verbose: false
      };

      const client = await initWonderKits(config);

      expect(client).toBeInstanceOf(WonderKitsClient);
      expect(client?.getMode()).toBe('http');

      const store = useWonderKitsStore.getState();
      expect(store.isConnected).toBe(true);
      expect(store.client).toBe(client);
      expect(store.error).toBeNull();
    });

    test('should handle partial service initialization', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      const config: WonderKitsReactConfig = {
        services: {
          fs: false,
          store: true,
          sql: false,
          appRegistry: true
        },
        httpPort: 1420
      };

      const client = await initWonderKits(config);

      expect(client).toBeInstanceOf(WonderKitsClient);
      expect(client?.isServiceInitialized('store')).toBe(true);
      expect(client?.isServiceInitialized('appRegistry')).toBe(true);
      expect(client?.isServiceInitialized('fs')).toBe(false);
      expect(client?.isServiceInitialized('sql')).toBe(false);
    });

    test('should prevent duplicate initialization', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      // First initialization
      const client1 = await initWonderKits({
        services: { fs: true, store: true },
        httpPort: 1420
      });

      // Second initialization should return same client
      const client2 = await initWonderKits({
        services: { fs: true, store: true },
        httpPort: 1420
      });

      expect(client1).toBe(client2);
      
      const logs = useWonderKitsStore.getState().logs;
      const duplicateWarning = logs.find(log => log.includes('已经初始化'));
      expect(duplicateWarning).toBeDefined();
    });

    test('should handle real App Registry operations', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      const client = await initWonderKits({
        services: { appRegistry: true },
        httpPort: 1420
      });

      expect(client?.isServiceInitialized('appRegistry')).toBe(true);

      const appRegistry = client?.appRegistry();
      expect(appRegistry).toBeDefined();

      // Test basic operations (these may fail if no apps exist, but shouldn't throw)
      try {
        const systemStatus = await appRegistry?.getSystemStatus();
        expect(systemStatus).toBeDefined();

        const appStats = await appRegistry?.getAppStats();
        expect(appStats).toBeDefined();

        const apps = await appRegistry?.getApps();
        expect(Array.isArray(apps)).toBe(true);
      } catch (error) {
        // Some operations might fail with empty database, that's ok for integration test
        console.log('App Registry operation returned expected error:', error.message);
      }
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle connection failures gracefully', async () => {
      // Use a port that definitely doesn't have a service
      const config: WonderKitsReactConfig = {
        services: { fs: true },
        httpPort: 9999
      };

      await expect(initWonderKits(config)).rejects.toThrow();

      const store = useWonderKitsStore.getState();
      expect(store.isConnected).toBe(false);
      expect(store.error).toBeTruthy();
    });

    test('should provide meaningful error diagnostics', async () => {
      const badClient = new WonderKitsClient({
        httpPort: 9999,
        httpHost: 'nonexistent-host.local'
      });

      const diagnostics = await badClient.getConnectionDiagnostics();
      expect(diagnostics).toContain('HTTP 服务不可用');
      expect(diagnostics).toContain('nonexistent-host.local:9999');
    });
  });

  describe('Store State Synchronization', () => {
    test('should sync store state with client state', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      const client = await initWonderKits({
        services: { fs: true, store: true },
        httpPort: 1420,
        verbose: true
      });

      const store = useWonderKitsStore.getState();
      
      expect(store.client).toBe(client);
      expect(store.isConnected).toBe(true);
      expect(store.clientMode).toBe('http');
      expect(store.logs.length).toBeGreaterThan(0);
      expect(store.error).toBeNull();

      // Test disconnection
      store.disconnect();
      
      expect(store.client).toBeNull();
      expect(store.isConnected).toBe(false);
      expect(store.clientMode).toBe('unknown');
    });

    test('should maintain log history during operations', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      const store = useWonderKitsStore.getState();
      const initialLogCount = store.logs.length;

      await initWonderKits({
        services: { fs: true },
        httpPort: 1420,
        verbose: true
      });

      const finalLogCount = store.logs.length;
      expect(finalLogCount).toBeGreaterThan(initialLogCount);

      // Check for expected log messages
      const logMessages = store.logs.join(' ');
      expect(logMessages).toContain('正在初始化');
      expect(logMessages).toContain('初始化成功');
    });
  });

  describe('Service Configuration Validation', () => {
    test('should handle complex service configurations', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      const config: WonderKitsReactConfig = {
        services: {
          fs: true,
          store: { 
            filename: 'integration-complex-test.json'
          },
          sql: { 
            connectionString: 'sqlite:integration-complex-test.db'
          },
          appRegistry: true
        },
        httpPort: 1420,
        httpHost: 'localhost',
        verbose: true
      };

      const client = await initWonderKits(config);

      expect(client).toBeDefined();
      expect(client?.isServiceInitialized('fs')).toBe(true);
      expect(client?.isServiceInitialized('store')).toBe(true);
      expect(client?.isServiceInitialized('sql')).toBe(true);
      expect(client?.isServiceInitialized('appRegistry')).toBe(true);

      const initializedServices = client?.getInitializedServices() || [];
      expect(initializedServices).toContain('fs');
      expect(initializedServices).toContain('store');
      expect(initializedServices).toContain('sql');
      expect(initializedServices).toContain('appRegistry');
    });

    test('should handle default configurations', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      // Use minimal config, should use defaults
      const client = await initWonderKits({
        httpPort: 1420
      });

      expect(client).toBeDefined();
      
      // Should initialize all services with defaults
      const initializedServices = client?.getInitializedServices() || [];
      expect(initializedServices.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Resource Management', () => {
    test('should not leak resources during multiple operations', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      // Multiple initialization attempts
      for (let i = 0; i < 3; i++) {
        await initWonderKits({
          services: { fs: true },
          httpPort: 1420
        });
      }

      const store = useWonderKitsStore.getState();
      expect(store.logs.length).toBeLessThan(100); // Should not accumulate infinitely
      
      // Should still be connected after multiple attempts
      expect(store.isConnected).toBe(true);
      expect(store.client).toBeTruthy();
    });

    test('should handle rapid connect/disconnect cycles', async () => {
      if (!isServiceAvailable) {
        console.log('Skipping: Backend service not available');
        return;
      }

      const store = useWonderKitsStore.getState();

      // Connect
      await initWonderKits({ httpPort: 1420 });
      expect(store.isConnected).toBe(true);

      // Disconnect
      store.disconnect();
      expect(store.isConnected).toBe(false);

      // Reconnect
      await initWonderKits({ httpPort: 1420 });
      expect(store.isConnected).toBe(true);
    });
  });
});