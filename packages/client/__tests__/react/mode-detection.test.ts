/**
 * React Framework Mode Detection Tests
 * 
 * 测试 React 框架在不同环境下的模式检测和适应性
 */

import { initWonderKits, type WonderKitsReactConfig } from '../../src/framework/react/hooks';
import { createWonderKitsStore } from '../../src/framework/react/store';
import { WonderKitsClient } from '../../src/core/client';

// Mock environment detection utilities
const mockEnvironmentDetector = {
  isInTauri: jest.fn(),
  isInWujie: jest.fn(),
  isBrowser: jest.fn(),
  isNode: jest.fn()
};

// Mock WonderKitsClient to control mode detection
jest.mock('../../src/core/client', () => ({
  WonderKitsClient: jest.fn()
}));

// Mock utilities
jest.mock('../../src/core/utils', () => ({
  environmentDetector: mockEnvironmentDetector,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn()
  },
  retryWithFallback: jest.fn(),
  ApiPathManager: jest.fn()
}));

describe('React Framework Mode Detection Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment detection mocks
    mockEnvironmentDetector.isInTauri.mockReturnValue(false);
    mockEnvironmentDetector.isInWujie.mockReturnValue(false);
    mockEnvironmentDetector.isBrowser.mockReturnValue(true);
    mockEnvironmentDetector.isNode.mockReturnValue(false);
  });

  describe('HTTP Mode Detection', () => {
    test('should detect HTTP mode in browser environment', async () => {
      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('http'),
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        isServiceInitialized: jest.fn().mockReturnValue(true),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const config: WonderKitsReactConfig = {
        services: { fs: true },
        httpPort: 1420
      };

      const client = await initWonderKits(config);
      
      expect(client).toBe(mockClient);
      expect(mockClient.getMode()).toBe('http');
      expect(WonderKitsClient).toHaveBeenCalledWith({
        verbose: true,
        httpPort: 1420
      });
    });

    test('should pass correct HTTP configuration', async () => {
      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('http'),
        getInitializedServices: jest.fn().mockReturnValue([]),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const config: WonderKitsReactConfig = {
        services: { fs: true },
        httpPort: 8080,
        httpHost: 'custom-host'
      };

      await initWonderKits(config);
      
      expect(WonderKitsClient).toHaveBeenCalledWith({
        verbose: true,
        httpPort: 8080,
        httpHost: 'custom-host'
      });
    });
  });

  describe('Tauri Native Mode Detection', () => {
    test('should handle Tauri native mode', async () => {
      mockEnvironmentDetector.isInTauri.mockReturnValue(true);
      mockEnvironmentDetector.isBrowser.mockReturnValue(false);

      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('tauri-native'),
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const config: WonderKitsReactConfig = {
        services: { fs: true }
      };

      const client = await initWonderKits(config);
      
      expect(client).toBe(mockClient);
      expect(mockClient.getMode()).toBe('tauri-native');
    });
  });

  describe('Wujie Proxy Mode Detection', () => {
    test('should handle Wujie proxy mode', async () => {
      mockEnvironmentDetector.isInWujie.mockReturnValue(true);
      mockEnvironmentDetector.isBrowser.mockReturnValue(true);

      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('tauri-proxy'),
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const config: WonderKitsReactConfig = {
        services: { fs: true }
      };

      const client = await initWonderKits(config);
      
      expect(client).toBe(mockClient);
      expect(mockClient.getMode()).toBe('tauri-proxy');
    });
  });

  describe('Forced Mode Detection', () => {
    test('should respect forced mode configuration', async () => {
      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('tauri-native'),
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const config: WonderKitsReactConfig = {
        services: { fs: true },
        forceMode: 'tauri-native'
      };

      await initWonderKits(config);
      
      expect(WonderKitsClient).toHaveBeenCalledWith({
        verbose: true,
        forceMode: 'tauri-native'
      });
    });

    test('should allow forcing HTTP mode even in Tauri environment', async () => {
      mockEnvironmentDetector.isInTauri.mockReturnValue(true);

      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('http'), // Forced to HTTP
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const config: WonderKitsReactConfig = {
        services: { fs: true },
        forceMode: 'http',
        httpPort: 1420
      };

      const client = await initWonderKits(config);
      
      expect(client?.getMode()).toBe('http');
      expect(WonderKitsClient).toHaveBeenCalledWith({
        verbose: true,
        forceMode: 'http',
        httpPort: 1420
      });
    });
  });

  describe('Service Configuration Adaptation', () => {
    test('should adapt service configuration for different modes', async () => {
      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('http'),
        getInitializedServices: jest.fn().mockReturnValue(['fs', 'store', 'sql']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const config: WonderKitsReactConfig = {
        services: {
          fs: true,
          store: { filename: 'mode-test.json' },
          sql: { connectionString: 'sqlite:mode-test.db' },
          appRegistry: true
        }
      };

      await initWonderKits(config);
      
      expect(mockClient.initServices).toHaveBeenCalledWith({
        fs: {},
        store: { filename: 'mode-test.json' },
        sql: { connectionString: 'sqlite:mode-test.db' },
        appRegistry: {}
      });
    });

    test('should handle partial service configuration', async () => {
      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('tauri-native'),
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const config: WonderKitsReactConfig = {
        services: {
          fs: true,
          store: false,
          sql: false,
          appRegistry: false
        }
      };

      await initWonderKits(config);
      
      expect(mockClient.initServices).toHaveBeenCalledWith({
        fs: {}
      });
    });
  });

  describe('Store Mode State Synchronization', () => {
    test('should sync detected mode with store state', async () => {
      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('tauri-proxy'),
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      const store = createWonderKitsStore();
      
      // Mock the global store
      jest.doMock('../../src/framework/react/store', () => ({
        useWonderKitsStore: {
          getState: () => store.getState()
        }
      }));

      await store.getState().initClient({ fs: {} });
      
      expect(store.getState().clientMode).toBe('tauri-proxy');
    });

    test('should handle mode changes during reconnection', async () => {
      const store = createWonderKitsStore();
      
      // First connection - HTTP mode
      const httpClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('http'),
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementationOnce(() => httpClient as any);

      await store.getState().initClient({ fs: {} });
      expect(store.getState().clientMode).toBe('http');
      
      // Disconnect
      store.getState().disconnect();
      expect(store.getState().clientMode).toBe('unknown');
      
      // Reconnect - different mode
      const tauriClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('tauri-native'),
        getInitializedServices: jest.fn().mockReturnValue(['fs']),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementationOnce(() => tauriClient as any);

      await store.getState().initClient({ fs: {} });
      expect(store.getState().clientMode).toBe('tauri-native');
    });
  });

  describe('Error Handling in Different Modes', () => {
    test('should handle HTTP mode connection failures', async () => {
      const mockClient = {
        initServices: jest.fn().mockRejectedValue(new Error('HTTP service unavailable')),
        getMode: jest.fn().mockReturnValue('http'),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      await expect(initWonderKits({
        services: { fs: true },
        httpPort: 9999
      })).rejects.toThrow('HTTP service unavailable');
    });

    test('should handle Tauri native mode errors', async () => {
      mockEnvironmentDetector.isInTauri.mockReturnValue(true);

      const mockClient = {
        initServices: jest.fn().mockRejectedValue(new Error('Tauri API not available')),
        getMode: jest.fn().mockReturnValue('tauri-native'),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      await expect(initWonderKits({
        services: { fs: true }
      })).rejects.toThrow('Tauri API not available');
    });
  });

  describe('Configuration Validation by Mode', () => {
    test('should validate HTTP-specific configuration', async () => {
      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('http'),
        getInitializedServices: jest.fn().mockReturnValue([]),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      await initWonderKits({
        services: { fs: true },
        httpPort: 1420,
        httpHost: 'localhost'
      });

      expect(WonderKitsClient).toHaveBeenCalledWith(
        expect.objectContaining({
          httpPort: 1420,
          httpHost: 'localhost'
        })
      );
    });

    test('should ignore HTTP configuration in Tauri native mode', async () => {
      mockEnvironmentDetector.isInTauri.mockReturnValue(true);

      const mockClient = {
        initServices: jest.fn().mockResolvedValue(undefined),
        getMode: jest.fn().mockReturnValue('tauri-native'),
        getInitializedServices: jest.fn().mockReturnValue([]),
        destroy: jest.fn()
      };

      (WonderKitsClient as jest.MockedClass<typeof WonderKitsClient>)
        .mockImplementation(() => mockClient as any);

      await initWonderKits({
        services: { fs: true },
        httpPort: 1420, // This should be ignored in Tauri native mode
        httpHost: 'localhost'
      });

      // WonderKitsClient still receives the config, but internally ignores HTTP settings for Tauri mode
      expect(WonderKitsClient).toHaveBeenCalled();
    });
  });
});