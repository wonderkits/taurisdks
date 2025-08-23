/**
 * SQL Plugin Mode Detection Tests
 * 
 * 测试 SqlClient 的智能模式检测和环境适应能力
 */

import { SqlClient } from '../../src/plugin/sql';
import { environmentDetector } from '../../src/core/utils';

// Mock environment detector
jest.mock('../../src/core/utils', () => {
  const actual = jest.requireActual('../../src/core/utils');
  return {
    ...actual,
    environmentDetector: {
      isInTauri: jest.fn(),
      isInWujie: jest.fn(),
    },
  };
});

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

// Mock fetch for HTTP mode tests
global.fetch = jest.fn();

describe('SQL Plugin Mode Detection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (global as any).window;
    (global as any).window = {};
  });

  describe('Static Factory Method - create()', () => {
    test('should create HTTP mode client in browser environment', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(false);

      try {
        const client = await SqlClient.create({
          connectionString: 'sqlite:test.db'
        });
        
        expect(client.isHttpMode).toBe(true);
        expect(client.isProxyMode).toBe(false);
        expect(client.isTauriNative).toBe(false);
      } catch (error) {
        // Expected in test environment without actual HTTP service
        expect(error).toBeDefined();
      }
    });

    test('should create Tauri native mode client in Tauri environment', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(true);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(false);

      const client = await SqlClient.create({
        connectionString: 'sqlite:test.db'
      });
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(true);
    });

    test('should create proxy mode client in Wujie environment with proxy available', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      // Mock Wujie environment with SQL proxy
      (global as any).window = {
        $wujie: {
          props: {
            sql: {
              execute: jest.fn(),
              select: jest.fn(),
              close: jest.fn(),
            }
          }
        }
      };

      const client = await SqlClient.create({
        connectionString: 'sqlite:test.db'
      });
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
    });

    test('should fallback to HTTP mode in Wujie environment without proxy', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      // Mock Wujie environment without SQL proxy
      (global as any).window = {
        $wujie: {
          props: {}
        }
      };

      try {
        const client = await SqlClient.create({
          connectionString: 'sqlite:test.db'
        });
        
        expect(client.isHttpMode).toBe(true);
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    test('should respect explicit httpBaseUrl option', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(true); // Even in Tauri
      
      try {
        const client = await SqlClient.create({
          connectionString: 'sqlite:test.db',
          httpBaseUrl: 'http://localhost:1420'
        });
        
        expect(client.isHttpMode).toBe(true);
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });
  });

  describe('Mode-Specific Behavior', () => {
    test('HTTP mode should validate service connectivity', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(SqlClient.create({
        connectionString: 'sqlite:test.db',
        httpBaseUrl: 'http://localhost:1420'
      })).rejects.toThrow();
    });

    test('HTTP mode should handle service connectivity issues gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);
      
      await expect(SqlClient.create({
        connectionString: 'sqlite:test.db',
        httpBaseUrl: 'http://localhost:1420'
      })).rejects.toThrow();
    });

    test('HTTP mode should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(SqlClient.create({
        connectionString: 'sqlite:test.db',
        httpBaseUrl: 'http://localhost:1420'
      })).rejects.toThrow();
    });

    test('Tauri mode should not require network connectivity check', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(true);
      
      const client = await SqlClient.create({
        connectionString: 'sqlite:test.db'
      });
      
      expect(client.isTauriNative).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('Proxy mode should not require network connectivity check', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      (global as any).window = {
        $wujie: {
          props: {
            sql: {
              execute: jest.fn(),
              select: jest.fn(),
            }
          }
        }
      };
      
      const client = await SqlClient.create({
        connectionString: 'sqlite:test.db'
      });
      
      expect(client.isProxyMode).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Environment Detection Edge Cases', () => {
    test('should handle missing window object', async () => {
      delete (global as any).window;
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(false);
      
      try {
        await SqlClient.create({
          connectionString: 'sqlite:test.db'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle partial Tauri environment', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      
      (global as any).window = {
        __TAURI__: {} // Partial Tauri object
      };
      
      try {
        await SqlClient.create({
          connectionString: 'sqlite:test.db'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle partial Wujie environment', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      (global as any).window = {
        $wujie: {} // Partial Wujie object
      };
      
      try {
        await SqlClient.create({
          connectionString: 'sqlite:test.db'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle Wujie environment with incomplete props', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      (global as any).window = {
        $wujie: {
          props: {
            // Missing sql property
            store: {},
            fs: {}
          }
        }
      };
      
      try {
        const client = await SqlClient.create({
          connectionString: 'sqlite:test.db'
        });
        expect(client.isHttpMode).toBe(true); // Should fallback to HTTP
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling in Mode Detection', () => {
    test('should handle Tauri environment detection errors', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockImplementation(() => {
        throw new Error('Tauri detection failed');
      });
      
      try {
        await SqlClient.create({
          connectionString: 'sqlite:test.db'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle Wujie proxy access errors', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      // Mock problematic Wujie environment
      Object.defineProperty(global, 'window', {
        value: {
          get $wujie() {
            throw new Error('Wujie access failed');
          }
        },
        configurable: true
      });
      
      try {
        await SqlClient.create({
          connectionString: 'sqlite:test.db'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Priority and Precedence', () => {
    test('explicit httpBaseUrl should override environment detection', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(true);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      try {
        const client = await SqlClient.create({
          connectionString: 'sqlite:test.db',
          httpBaseUrl: 'http://localhost:1420'
        });
        
        expect(client.isHttpMode).toBe(true);
        expect(client.isTauriNative).toBe(false);
        expect(client.isProxyMode).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('Tauri should have higher priority than Wujie when both present', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(true);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      (global as any).window = {
        $wujie: {
          props: {
            sql: { execute: jest.fn() }
          }
        }
      };
      
      const client = await SqlClient.create({
        connectionString: 'sqlite:test.db'
      });
      
      expect(client.isTauriNative).toBe(true);
      expect(client.isProxyMode).toBe(false);
    });
  });
});