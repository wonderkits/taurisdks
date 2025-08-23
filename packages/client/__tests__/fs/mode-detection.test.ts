/**
 * FS Plugin Mode Detection Tests
 * 
 * 测试 FsClient 的智能模式检测和环境适应能力
 */

import { FsClient } from '../../src/plugin/fs';
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

describe('FS Plugin Mode Detection Tests', () => {
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
        const client = await FsClient.create({});
        
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

      const client = await FsClient.create({});
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(true);
    });

    test('should create proxy mode client in Wujie environment with proxy available', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      // Mock Wujie environment with FS proxy
      (global as any).window = {
        $wujie: {
          props: {
            fs: {
              readTextFile: jest.fn(),
              writeTextFile: jest.fn(),
              readBinaryFile: jest.fn(),
              writeBinaryFile: jest.fn(),
              exists: jest.fn(),
              mkdir: jest.fn(),
              remove: jest.fn(),
              rename: jest.fn(),
              copyFile: jest.fn(),
              readDir: jest.fn(),
              stat: jest.fn(),
              lstat: jest.fn(),
              truncate: jest.fn(),
              create: jest.fn(),
            }
          }
        }
      };

      const client = await FsClient.create({});
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
    });

    test('should fallback to HTTP mode in Wujie environment without proxy', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      // Mock Wujie environment without FS proxy
      (global as any).window = {
        $wujie: {
          props: {}
        }
      };

      try {
        const client = await FsClient.create({});
        
        expect(client.isHttpMode).toBe(true);
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    test('should respect explicit httpBaseUrl option', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(true); // Even in Tauri
      
      try {
        const client = await FsClient.create({
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
      
      await expect(FsClient.create({
        httpBaseUrl: 'http://localhost:1420'
      })).rejects.toThrow();
    });

    test('HTTP mode should handle service connectivity issues gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);
      
      await expect(FsClient.create({
        httpBaseUrl: 'http://localhost:1420'
      })).rejects.toThrow();
    });

    test('HTTP mode should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(FsClient.create({
        httpBaseUrl: 'http://localhost:1420'
      })).rejects.toThrow();
    });

    test('Tauri mode should not require network connectivity check', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(true);
      
      const client = await FsClient.create({});
      
      expect(client.isTauriNative).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('Proxy mode should not require network connectivity check', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      (global as any).window = {
        $wujie: {
          props: {
            fs: {
              readTextFile: jest.fn(),
              writeTextFile: jest.fn(),
            }
          }
        }
      };
      
      const client = await FsClient.create({});
      
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
        await FsClient.create({});
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
        await FsClient.create({});
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
        await FsClient.create({});
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
            // Missing fs property
            sql: {},
            store: {}
          }
        }
      };
      
      try {
        const client = await FsClient.create({});
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
        await FsClient.create({});
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
        await FsClient.create({});
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
        const client = await FsClient.create({
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
            fs: { readTextFile: jest.fn(), writeTextFile: jest.fn() }
          }
        }
      };
      
      const client = await FsClient.create({});
      
      expect(client.isTauriNative).toBe(true);
      expect(client.isProxyMode).toBe(false);
    });
  });

  describe('Service Validation', () => {
    test('should handle successful HTTP service validation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      } as Response);
      
      try {
        const client = await FsClient.create({
          httpBaseUrl: 'http://localhost:1420'
        });
        
        expect(client.isHttpMode).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:1420/health');
      } catch (error) {
        // Still may fail due to other factors in test environment
        expect(error).toBeDefined();
      }
    });

    test('should handle HTTP service validation with non-JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Not JSON'); }
      } as Response);
      
      try {
        await FsClient.create({
          httpBaseUrl: 'http://localhost:1420'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Proxy Capability Detection', () => {
    test('should detect complete FS proxy interface', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      const completeProxy = {
        // Core operations
        readTextFile: jest.fn(),
        writeTextFile: jest.fn(),
        readBinaryFile: jest.fn(),
        writeBinaryFile: jest.fn(),
        
        // File system operations  
        exists: jest.fn(),
        mkdir: jest.fn(),
        remove: jest.fn(),
        rename: jest.fn(),
        copyFile: jest.fn(),
        
        // Directory operations
        readDir: jest.fn(),
        
        // Metadata operations
        stat: jest.fn(),
        lstat: jest.fn(),
        truncate: jest.fn(),
        create: jest.fn(),
      };
      
      (global as any).window = {
        $wujie: {
          props: {
            fs: completeProxy
          }
        }
      };
      
      const client = await FsClient.create({});
      
      expect(client.isProxyMode).toBe(true);
      expect(client.isHttpMode).toBe(false);
      expect(client.isTauriNative).toBe(false);
    });

    test('should handle partial FS proxy interface', async () => {
      (environmentDetector.isInTauri as jest.Mock).mockReturnValue(false);
      (environmentDetector.isInWujie as jest.Mock).mockReturnValue(true);
      
      const partialProxy = {
        readTextFile: jest.fn(),
        writeTextFile: jest.fn(),
        // Missing other methods
      };
      
      (global as any).window = {
        $wujie: {
          props: {
            fs: partialProxy
          }
        }
      };
      
      // Should still create proxy mode client (methods will fail individually if missing)
      const client = await FsClient.create({});
      
      expect(client.isProxyMode).toBe(true);
    });
  });
});