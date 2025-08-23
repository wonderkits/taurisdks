/**
 * React Framework Unit Tests
 * 
 * 测试 React hooks 和 store 的基础功能和单个模式的行为
 */

import { createWonderKitsStore } from '../../src/framework/react/store';
import { WonderKitsClient } from '../../src/core/client';

// Mock WonderKitsClient
jest.mock('../../src/core/client', () => ({
  WonderKitsClient: jest.fn().mockImplementation((config) => ({
    initServices: jest.fn().mockResolvedValue(undefined),
    getMode: jest.fn().mockReturnValue('http'),
    getInitializedServices: jest.fn().mockReturnValue(['fs', 'store', 'sql']),
    isServiceInitialized: jest.fn().mockReturnValue(true),
    destroy: jest.fn(),
    appRegistry: jest.fn().mockReturnValue({
      getApp: jest.fn().mockResolvedValue({ id: 'test-app', name: 'Test App' }),
      getApps: jest.fn().mockResolvedValue([{ id: 'app1', name: 'App 1' }]),
      getSystemStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
      getAppStats: jest.fn().mockResolvedValue({ total: 10, active: 5 }),
      activateApp: jest.fn().mockResolvedValue(undefined),
      deactivateApp: jest.fn().mockResolvedValue(undefined),
      uninstallApp: jest.fn().mockResolvedValue(undefined),
      bulkActivateApps: jest.fn().mockResolvedValue({ success: 2, failed: 0 }),
      bulkDeactivateApps: jest.fn().mockResolvedValue({ success: 2, failed: 0 }),
      bulkUninstallApps: jest.fn().mockResolvedValue({ success: 2, failed: 0 }),
      registerApp: jest.fn().mockResolvedValue('new-app-id'),
      devRegisterApp: jest.fn().mockResolvedValue({ appId: 'dev-app', devUrl: 'http://localhost:3000' })
    })
  }))
}));

describe('React Framework Unit Tests', () => {
  
  describe('Store Creation and Initial State', () => {
    test('should create store with correct initial state', () => {
      const store = createWonderKitsStore();
      const state = store.getState();
      
      expect(state.client).toBeNull();
      expect(state.isConnected).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.clientMode).toBe('unknown');
      expect(state.logs).toEqual([]);
      expect(state.error).toBeNull();
    });

    test('should not include removed config cache fields', () => {
      const store = createWonderKitsStore();
      const state = store.getState();
      
      expect(state).not.toHaveProperty('fsConfig');
      expect(state).not.toHaveProperty('storeConfig');
      expect(state).not.toHaveProperty('sqlConfig');
    });

    test('should not include removed initWithServices method', () => {
      const store = createWonderKitsStore();
      const state = store.getState();
      
      expect(state).not.toHaveProperty('initWithServices');
    });
  });

  describe('Store Actions', () => {
    let store: ReturnType<typeof createWonderKitsStore>;

    beforeEach(() => {
      jest.clearAllMocks();
      store = createWonderKitsStore();
      store.getState().reset();
    });

    test('should add log with timestamp', () => {
      const testMessage = 'Test log message';
      
      store.getState().addLog(testMessage);
      
      const state = store.getState();
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0]).toContain(testMessage);
      expect(state.logs[0]).toMatch(/\[\d{1,2}:\d{2}:\d{2}.*\]/); // timestamp format
    });

    test('should limit logs to 20 entries', () => {
      const { addLog } = store.getState();
      
      // Add 25 logs
      for (let i = 0; i < 25; i++) {
        addLog(`Log message ${i}`);
      }
      
      const state = store.getState();
      expect(state.logs).toHaveLength(20);
      expect(state.logs[0]).toContain('Log message 5'); // oldest kept
      expect(state.logs[19]).toContain('Log message 24'); // newest
    });

    test('should clear all logs', () => {
      store.getState().addLog('Test log');
      expect(store.getState().logs).toHaveLength(1);
      
      store.getState().clearLogs();
      expect(store.getState().logs).toHaveLength(0);
    });

    test('should set and clear errors', () => {
      const errorMessage = 'Test error';
      
      store.getState().setError(errorMessage);
      expect(store.getState().error).toBe(errorMessage);
      
      store.getState().setError(null);
      expect(store.getState().error).toBeNull();
    });
  });

  describe('Client Initialization', () => {
    let store: ReturnType<typeof createWonderKitsStore>;

    beforeEach(() => {
      jest.clearAllMocks();
      store = createWonderKitsStore();
      store.getState().reset();
    });

    test('should initialize client successfully', async () => {
      const services = {
        fs: {},
        store: { filename: 'test.json' },
        sql: { connectionString: 'sqlite:test.db' }
      };

      await store.getState().initClient(services);

      const state = store.getState();
      expect(state.client).toBeTruthy();
      expect(state.isConnected).toBe(true);
      expect(state.clientMode).toBe('http');
      expect(state.isLoading).toBe(false);
    });

    test('should handle initialization errors', async () => {
      const mockError = new Error('Initialization failed');
      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementationOnce(() => ({
          initServices: jest.fn().mockRejectedValue(mockError),
          getMode: jest.fn().mockReturnValue('http')
        } as any));

      const services = { fs: {} };

      await expect(store.getState().initClient(services)).rejects.toThrow('Initialization failed');

      const state = store.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toContain('Initialization failed');
      expect(state.isConnected).toBe(false);
    });

    test('should log initialization process', async () => {
      const services = { fs: {}, store: { filename: 'test.json' } };

      await store.getState().initClient(services, { verbose: true });

      const state = store.getState();
      const logMessages = state.logs.join(' ');
      expect(logMessages).toContain('正在初始化 WonderKits 统一客户端');
      expect(logMessages).toContain('客户端初始化成功');
    });
  });

  describe('Client Lifecycle', () => {
    let store: ReturnType<typeof createWonderKitsStore>;

    beforeEach(() => {
      jest.clearAllMocks();
      store = createWonderKitsStore();
      store.getState().reset();
    });

    test('should disconnect client correctly', async () => {
      // Initialize first
      await store.getState().initClient({ fs: {} });
      expect(store.getState().isConnected).toBe(true);
      
      const mockClient = store.getState().client;
      
      // Disconnect
      store.getState().disconnect();
      
      const state = store.getState();
      expect(state.client).toBeNull();
      expect(state.isConnected).toBe(false);
      expect(state.clientMode).toBe('unknown');
      expect(state.error).toBeNull();
      expect(mockClient?.destroy).toHaveBeenCalled();
    });

    test('should reset all state', async () => {
      // Initialize and add some state
      await store.getState().initClient({ fs: {} });
      store.getState().addLog('Test log');
      store.getState().setError('Test error');
      
      // Reset
      store.getState().reset();
      
      const state = store.getState();
      expect(state.client).toBeNull();
      expect(state.isConnected).toBe(false);
      expect(state.logs).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('Store Configuration', () => {
    test('should create store with custom config', () => {
      const customConfig = { httpPort: 8080, verbose: true };
      const store = createWonderKitsStore(customConfig);
      
      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
    });

    test('should provide all required methods', () => {
      const store = createWonderKitsStore();
      const state = store.getState();
      
      const requiredMethods = [
        'addLog',
        'clearLogs', 
        'setError',
        'initClient',
        'disconnect',
        'reset'
      ];

      requiredMethods.forEach(method => {
        expect(state).toHaveProperty(method);
        expect(typeof state[method]).toBe('function');
      });
    });
  });

  describe('Method Availability', () => {
    test('should have all core methods available', () => {
      const store = createWonderKitsStore();
      const state = store.getState();
      
      // State properties
      expect(state).toHaveProperty('client');
      expect(state).toHaveProperty('isConnected');
      expect(state).toHaveProperty('isLoading');
      expect(state).toHaveProperty('clientMode');
      expect(state).toHaveProperty('logs');
      expect(state).toHaveProperty('error');
      
      // Action methods
      expect(typeof state.addLog).toBe('function');
      expect(typeof state.clearLogs).toBe('function');
      expect(typeof state.setError).toBe('function');
      expect(typeof state.initClient).toBe('function');
      expect(typeof state.disconnect).toBe('function');
      expect(typeof state.reset).toBe('function');
    });

    test('should not have deprecated methods', () => {
      const store = createWonderKitsStore();
      const state = store.getState();
      
      // These methods should not exist after refactoring
      expect(state).not.toHaveProperty('initWithServices');
      expect(state).not.toHaveProperty('fsConfig');
      expect(state).not.toHaveProperty('storeConfig');
      expect(state).not.toHaveProperty('sqlConfig');
    });
  });
});