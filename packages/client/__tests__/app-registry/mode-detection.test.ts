/**
 * App Registry Mode Detection Tests
 * 
 * 测试多模式环境检测和智能模式选择功能
 */

import { AppRegistryClient } from '../../src/plugin/app-registry';

// Mock environment globals for testing
const mockWindow = (overrides = {}) => {
  Object.defineProperty(global, 'window', {
    value: {
      ...overrides
    },
    writable: true,
    configurable: true
  });
};

const mockFetch = (response: any) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: response.ok !== false,
    status: response.status || 200,
    json: jest.fn().mockResolvedValue(response.data || { status: 'ok', message: 'Test OK' }),
  } as any);
};

describe('App Registry Mode Detection Tests', () => {
  
  beforeEach(() => {
    jest.resetAllMocks();
    delete (global as any).window;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Static Factory Method - create()', () => {
    test('should create HTTP mode client in browser environment', async () => {
      // Mock browser environment (no Tauri, no Wujie)
      mockWindow({});
      mockFetch({ status: 'ok' });
      
      const client = await AppRegistryClient.create();
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
      expect(client.isProxyMode).toBe(false);
    });

    test('should create Tauri native mode client in Tauri environment', async () => {
      // Mock Tauri environment
      mockWindow({
        __TAURI__: {}
      });
      
      const client = await AppRegistryClient.create();
      
      expect(client.isTauriNative).toBe(true);
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(false);
    });

    test('should create proxy mode client in Wujie environment with proxy available', async () => {
      // Mock Wujie environment with app registry proxy
      mockWindow({
        __POWERED_BY_WUJIE__: true,
        $wujie: {
          props: {
            appRegistry: {
              getApps: jest.fn(),
              getApp: jest.fn(),
              healthCheck: jest.fn(),
            }
          }
        }
      });
      
      const client = await AppRegistryClient.create();
      
      expect(client.isProxyMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
      expect(client.isHttpMode).toBe(false);
    });

    test('should fallback to HTTP mode in Wujie environment without proxy', async () => {
      // Mock Wujie environment without app registry proxy
      mockWindow({
        __POWERED_BY_WUJIE__: true,
        $wujie: {
          props: {
            // No appRegistry proxy
            otherService: {}
          }
        }
      });
      mockFetch({ status: 'ok' });
      
      const client = await AppRegistryClient.create();
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(false);
    });

    test('should respect explicit httpBaseUrl option', async () => {
      mockWindow({});
      mockFetch({ status: 'ok' });
      
      const client = await AppRegistryClient.create({
        httpBaseUrl: 'http://custom-host:9999'
      });
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
      expect(client.isProxyMode).toBe(false);
    });
  });

  describe('Mode-Specific Behavior', () => {
    test('HTTP mode should validate service connectivity', async () => {
      mockWindow({});
      mockFetch({ status: 'ok', message: 'Service OK' });
      
      // Should not throw during creation with valid service
      const client = await AppRegistryClient.create({
        httpBaseUrl: 'http://localhost:1421'
      });
      
      expect(client.isHttpMode).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('HTTP mode should handle service connectivity issues gracefully', async () => {
      mockWindow({});
      mockFetch({ ok: false, status: 500 });
      
      // Should still create client even with service issues (with warning)
      const client = await AppRegistryClient.create({
        httpBaseUrl: 'http://localhost:1421'
      });
      
      expect(client.isHttpMode).toBe(true);
    });

    test('HTTP mode should handle network errors gracefully', async () => {
      mockWindow({});
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      // Should still create client even with network errors (with warning)
      const client = await AppRegistryClient.create({
        httpBaseUrl: 'http://localhost:1421'
      });
      
      expect(client.isHttpMode).toBe(true);
    });

    test('Tauri mode should not require network connectivity check', async () => {
      mockWindow({
        __TAURI__: {}
      });
      
      // Should not call fetch for Tauri mode
      const client = await AppRegistryClient.create();
      
      expect(client.isTauriNative).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('Proxy mode should not require network connectivity check', async () => {
      mockWindow({
        __POWERED_BY_WUJIE__: true,
        $wujie: {
          props: {
            appRegistry: {
              getApps: jest.fn(),
            }
          }
        }
      });
      
      // Should not call fetch for proxy mode
      const client = await AppRegistryClient.create();
      
      expect(client.isProxyMode).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Environment Detection Edge Cases', () => {
    test('should handle missing window object', async () => {
      // No window object (Node.js environment)
      delete (global as any).window;
      mockFetch({ status: 'ok' });
      
      const client = await AppRegistryClient.create();
      
      expect(client.isHttpMode).toBe(true);
    });

    test('should handle partial Tauri environment', async () => {
      // Partial Tauri-like environment
      mockWindow({
        __TAURI_METADATA__: {} // Has metadata but not main API
      });
      mockFetch({ status: 'ok' });
      
      const client = await AppRegistryClient.create();
      
      // Should fallback to HTTP mode
      expect(client.isHttpMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
    });

    test('should handle partial Wujie environment', async () => {
      // Partial Wujie environment
      mockWindow({
        __POWERED_BY_WUJIE__: true,
        // Missing $wujie object
      });
      mockFetch({ status: 'ok' });
      
      const client = await AppRegistryClient.create();
      
      // Should fallback to HTTP mode
      expect(client.isHttpMode).toBe(true);
      expect(client.isProxyMode).toBe(false);
    });

    test('should handle Wujie environment with incomplete props', async () => {
      mockWindow({
        __POWERED_BY_WUJIE__: true,
        $wujie: {
          // Missing props
        }
      });
      mockFetch({ status: 'ok' });
      
      const client = await AppRegistryClient.create();
      
      // Should fallback to HTTP mode
      expect(client.isHttpMode).toBe(true);
      expect(client.isProxyMode).toBe(false);
    });
  });

  describe('Error Handling in Mode Detection', () => {
    test('should handle Tauri environment detection errors', async () => {
      // Mock an environment that might throw during detection
      const mockWindowObj = {
        __TAURI_METADATA__: {} // Has metadata but will throw on __TAURI__ access
      };
      
      // Define the getter that throws
      Object.defineProperty(mockWindowObj, '__TAURI__', {
        get() {
          throw new Error('Detection error');
        },
        configurable: true
      });
      
      Object.defineProperty(global, 'window', {
        value: mockWindowObj,
        writable: true,
        configurable: true
      });
      
      mockFetch({ status: 'ok' });
      
      // Should not throw and fallback to HTTP mode
      const client = await AppRegistryClient.create();
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
    });

    test('should handle Wujie proxy access errors', async () => {
      const mockWindowObj = {
        __POWERED_BY_WUJIE__: true
      };
      
      // Define the getter that throws
      Object.defineProperty(mockWindowObj, '$wujie', {
        get() {
          throw new Error('Proxy access error');
        },
        configurable: true
      });
      
      Object.defineProperty(global, 'window', {
        value: mockWindowObj,
        writable: true,
        configurable: true
      });
      
      mockFetch({ status: 'ok' });
      
      // Should not throw and fallback to HTTP mode
      const client = await AppRegistryClient.create();
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isProxyMode).toBe(false);
    });
  });

  describe('Priority and Precedence', () => {
    test('explicit httpBaseUrl should override environment detection', async () => {
      // Even in Tauri environment, explicit HTTP URL should take precedence
      mockWindow({
        __TAURI__: {}
      });
      mockFetch({ status: 'ok' });
      
      const client = await AppRegistryClient.create({
        httpBaseUrl: 'http://localhost:1421'
      });
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
    });

    test('Tauri should have higher priority than Wujie when both present', async () => {
      mockWindow({
        __TAURI__: {},
        __POWERED_BY_WUJIE__: true,
        $wujie: {
          props: {
            appRegistry: {}
          }
        }
      });
      
      const client = await AppRegistryClient.create();
      
      expect(client.isTauriNative).toBe(true);
      expect(client.isProxyMode).toBe(false);
      expect(client.isHttpMode).toBe(false);
    });
  });
});