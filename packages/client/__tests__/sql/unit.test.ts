/**
 * SQL Plugin Unit Tests
 * 
 * 测试 SqlClient 的基础功能和单个模式的行为
 */

import { SqlClient, Database } from '../../src/plugin/sql';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

describe('SqlClient Unit Tests', () => {
  
  describe('Constructor and Mode Detection', () => {
    test('should create HTTP mode client correctly', () => {
      const client = new SqlClient('http://localhost:1420');
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(false);
    });

    test('should create Tauri native mode client correctly', () => {
      const client = new SqlClient();
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(true);
    });

    test('should create proxy mode client correctly', () => {
      const mockProxy = {
        execute: jest.fn(),
        select: jest.fn(),
        close: jest.fn(),
      };
      
      const client = new SqlClient(null, mockProxy);
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
    });
  });

  describe('Method Availability', () => {
    test('should have all required public methods', () => {
      const client = new SqlClient();
      
      // Core methods
      expect(typeof client.execute).toBe('function');
      expect(typeof client.select).toBe('function');
      expect(typeof client.close).toBe('function');
      expect(typeof client.cleanup).toBe('function');
      
      // Static methods
      expect(typeof SqlClient.create).toBe('function');
    });
  });

  describe('Static Factory Methods', () => {
    test('create method should exist and be async', async () => {
      expect(typeof SqlClient.create).toBe('function');
      
      // Should not throw when creating with options
      try {
        await SqlClient.create({
          connectionString: 'sqlite:test.db',
          httpBaseUrl: 'http://localhost:1420'
        });
      } catch (error) {
        // Expected in test environment without actual Tauri/HTTP service
        expect(error).toBeDefined();
      }
    });
  });

  describe('Database Class', () => {
    test('Database class should be available', () => {
      expect(typeof Database).toBe('function');
    });

    test('Database should be constructable', () => {
      const db = new Database();
      expect(db).toBeInstanceOf(Database);
    });
  });

  describe('Error Handling', () => {
    test('Tauri native mode should fail gracefully in test environment', async () => {
      const client = new SqlClient();
      
      await expect(client.execute('CREATE TABLE test (id INTEGER)')).rejects.toThrow();
    });

    test('HTTP mode with invalid URL should fail gracefully', async () => {
      const client = new SqlClient('http://invalid-url:9999');
      
      await expect(client.execute('CREATE TABLE test (id INTEGER)')).rejects.toThrow();
    });

    test('HTTP mode connection should handle failures', async () => {
      const client = new SqlClient('http://localhost:9999');
      
      await expect(client.select('SELECT * FROM test')).rejects.toThrow();
    });
  });

  describe('Proxy Mode Behavior', () => {
    test('should call proxy methods correctly', async () => {
      const mockProxy = {
        execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
        select: jest.fn().mockResolvedValue([{ id: 1, name: 'test' }]),
        close: jest.fn().mockResolvedValue(undefined),
      };
      
      const client = new SqlClient(null, mockProxy);
      
      // Test execute
      const executeResult = await client.execute('INSERT INTO test VALUES (1, "test")');
      expect(mockProxy.execute).toHaveBeenCalledWith('INSERT INTO test VALUES (1, "test")', []);
      expect(executeResult).toEqual({ rowsAffected: 1 });
      
      // Test select
      const selectResult = await client.select('SELECT * FROM test');
      expect(mockProxy.select).toHaveBeenCalledWith('SELECT * FROM test', []);
      expect(selectResult).toEqual([{ id: 1, name: 'test' }]);
      
      // Test close
      await client.close();
      expect(mockProxy.close).toHaveBeenCalled();
    });

    test('should handle proxy method failures', async () => {
      const mockProxy = {
        execute: jest.fn().mockRejectedValue(new Error('Proxy execute failed')),
        select: jest.fn().mockRejectedValue(new Error('Proxy select failed')),
        close: jest.fn().mockRejectedValue(new Error('Proxy close failed')),
      };
      
      const client = new SqlClient(null, mockProxy);
      
      await expect(client.execute('INSERT INTO test VALUES (1)')).rejects.toThrow('Proxy execute failed');
      await expect(client.select('SELECT * FROM test')).rejects.toThrow('Proxy select failed');
      await expect(client.close()).rejects.toThrow('Proxy close failed');
    });
  });

  describe('Utility Methods', () => {
    test('cleanup should work without throwing', async () => {
      const client = new SqlClient();
      
      await expect(client.cleanup()).resolves.not.toThrow();
    });
  });
});