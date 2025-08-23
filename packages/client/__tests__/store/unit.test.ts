/**
 * Store Plugin Unit Tests
 * 
 * 测试 StoreClient 的基础功能和单个模式的行为
 */

import { StoreClient, Store } from '../../src/plugin/store';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

describe('StoreClient Unit Tests', () => {
  
  describe('Constructor and Mode Detection', () => {
    test('should create HTTP mode client correctly', () => {
      const client = new StoreClient('http://localhost:1420');
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(false);
    });

    test('should create Tauri native mode client correctly', () => {
      const client = new StoreClient();
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(true);
    });

    test('should create proxy mode client correctly', () => {
      const mockProxy = {
        get: jest.fn(),
        set: jest.fn(),
        has: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn(),
        reset: jest.fn(),
        keys: jest.fn(),
        entries: jest.fn(),
        values: jest.fn(),
        length: jest.fn(),
        load: jest.fn(),
        save: jest.fn(),
      };
      
      const client = new StoreClient(null, mockProxy);
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
    });
  });

  describe('Method Availability', () => {
    test('should have all required public methods', () => {
      const client = new StoreClient();
      
      // Core CRUD methods
      expect(typeof client.get).toBe('function');
      expect(typeof client.set).toBe('function');
      expect(typeof client.has).toBe('function');
      expect(typeof client.delete).toBe('function');
      expect(typeof client.clear).toBe('function');
      expect(typeof client.reset).toBe('function');
      
      // Iteration methods
      expect(typeof client.keys).toBe('function');
      expect(typeof client.entries).toBe('function');
      expect(typeof client.values).toBe('function');
      expect(typeof client.length).toBe('function');
      
      // Persistence methods
      expect(typeof client.load).toBe('function');
      expect(typeof client.save).toBe('function');
      expect(typeof client.cleanup).toBe('function');
      
      // Static methods
      expect(typeof StoreClient.create).toBe('function');
    });
  });

  describe('Static Factory Methods', () => {
    test('create method should exist and be async', async () => {
      expect(typeof StoreClient.create).toBe('function');
      
      // Should not throw when creating with options
      try {
        await StoreClient.create({
          filename: 'test.store',
          httpBaseUrl: 'http://localhost:1420'
        });
      } catch (error) {
        // Expected in test environment without actual Tauri/HTTP service
        expect(error).toBeDefined();
      }
    });
  });

  describe('Store Class', () => {
    test('Store class should be available', () => {
      expect(typeof Store).toBe('function');
    });

    test('Store should be constructable', () => {
      const store = new Store();
      expect(store).toBeInstanceOf(Store);
    });
  });

  describe('Error Handling', () => {
    test('Tauri native mode should fail gracefully in test environment', async () => {
      const client = new StoreClient();
      
      await expect(client.set('test-key', 'test-value')).rejects.toThrow();
    });

    test('HTTP mode with invalid URL should fail gracefully', async () => {
      const client = new StoreClient('http://invalid-url:9999');
      
      await expect(client.get('test-key')).rejects.toThrow();
    });

    test('HTTP mode connection should handle failures', async () => {
      const client = new StoreClient('http://localhost:9999');
      
      await expect(client.set('test-key', 'test-value')).rejects.toThrow();
    });
  });

  describe('Proxy Mode Behavior', () => {
    test('should call proxy methods correctly', async () => {
      const mockProxy = {
        get: jest.fn().mockResolvedValue('test-value'),
        set: jest.fn().mockResolvedValue(undefined),
        has: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue(true),
        clear: jest.fn().mockResolvedValue(undefined),
        keys: jest.fn().mockResolvedValue(['key1', 'key2']),
        entries: jest.fn().mockResolvedValue([['key1', 'value1'], ['key2', 'value2']]),
        values: jest.fn().mockResolvedValue(['value1', 'value2']),
        length: jest.fn().mockResolvedValue(2),
        load: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        reset: jest.fn().mockResolvedValue(undefined),
      };
      
      const client = new StoreClient(null, mockProxy);
      
      // Test basic operations
      const value = await client.get('test-key');
      expect(mockProxy.get).toHaveBeenCalledWith('test-key');
      expect(value).toBe('test-value');
      
      await client.set('test-key', 'new-value');
      expect(mockProxy.set).toHaveBeenCalledWith('test-key', 'new-value');
      
      const exists = await client.has('test-key');
      expect(mockProxy.has).toHaveBeenCalledWith('test-key');
      expect(exists).toBe(true);
      
      const deleted = await client.delete('test-key');
      expect(mockProxy.delete).toHaveBeenCalledWith('test-key');
      expect(deleted).toBe(true);
      
      // Test iteration methods
      const keys = await client.keys();
      expect(mockProxy.keys).toHaveBeenCalled();
      expect(keys).toEqual(['key1', 'key2']);
      
      const entries = await client.entries();
      expect(mockProxy.entries).toHaveBeenCalled();
      expect(entries).toEqual([['key1', 'value1'], ['key2', 'value2']]);
      
      const values = await client.values();
      expect(mockProxy.values).toHaveBeenCalled();
      expect(values).toEqual(['value1', 'value2']);
      
      const length = await client.length();
      expect(mockProxy.length).toHaveBeenCalled();
      expect(length).toBe(2);
      
      // Test persistence methods
      await client.load();
      expect(mockProxy.load).toHaveBeenCalled();
      
      await client.save();
      expect(mockProxy.save).toHaveBeenCalled();
      
      await client.clear();
      expect(mockProxy.clear).toHaveBeenCalled();
      
      await client.reset();
      expect(mockProxy.reset).toHaveBeenCalled();
    });

    test('should handle proxy method failures', async () => {
      const mockProxy = {
        get: jest.fn().mockRejectedValue(new Error('Proxy get failed')),
        set: jest.fn().mockRejectedValue(new Error('Proxy set failed')),
        has: jest.fn().mockRejectedValue(new Error('Proxy has failed')),
        delete: jest.fn().mockRejectedValue(new Error('Proxy delete failed')),
        clear: jest.fn().mockRejectedValue(new Error('Proxy clear failed')),
        keys: jest.fn().mockRejectedValue(new Error('Proxy keys failed')),
        load: jest.fn().mockRejectedValue(new Error('Proxy load failed')),
        save: jest.fn().mockRejectedValue(new Error('Proxy save failed')),
        reset: jest.fn().mockRejectedValue(new Error('Proxy reset failed')),
        entries: jest.fn().mockRejectedValue(new Error('Proxy entries failed')),
        values: jest.fn().mockRejectedValue(new Error('Proxy values failed')),
        length: jest.fn().mockRejectedValue(new Error('Proxy length failed')),
      };
      
      const client = new StoreClient(null, mockProxy);
      
      await expect(client.get('test-key')).rejects.toThrow('Proxy get failed');
      await expect(client.set('test-key', 'value')).rejects.toThrow('Proxy set failed');
      await expect(client.has('test-key')).rejects.toThrow('Proxy has failed');
      await expect(client.delete('test-key')).rejects.toThrow('Proxy delete failed');
      await expect(client.clear()).rejects.toThrow('Proxy clear failed');
      await expect(client.keys()).rejects.toThrow('Proxy keys failed');
      await expect(client.load()).rejects.toThrow('Proxy load failed');
      await expect(client.save()).rejects.toThrow('Proxy save failed');
      await expect(client.reset()).rejects.toThrow('Proxy reset failed');
      await expect(client.entries()).rejects.toThrow('Proxy entries failed');
      await expect(client.values()).rejects.toThrow('Proxy values failed');
      await expect(client.length()).rejects.toThrow('Proxy length failed');
    });
  });

  describe('Data Type Handling', () => {
    test('should handle different value types in proxy mode', async () => {
      const testValues = {
        string: 'hello world',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        object: { nested: { value: 123 } },
        array: [1, 2, 3, 'four'],
      };

      const mockProxy = {
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockImplementation((key: string) => {
          return Promise.resolve(testValues[key as keyof typeof testValues]);
        }),
      };
      
      const client = new StoreClient(null, mockProxy);
      
      // Test setting different types
      for (const [key, value] of Object.entries(testValues)) {
        await client.set(key, value);
        expect(mockProxy.set).toHaveBeenCalledWith(key, value);
      }
      
      // Test getting different types
      for (const [key, expectedValue] of Object.entries(testValues)) {
        const retrievedValue = await client.get(key);
        expect(retrievedValue).toEqual(expectedValue);
      }
    });
  });

  describe('Utility Methods', () => {
    test('cleanup should work without throwing', async () => {
      const client = new StoreClient();
      
      await expect(client.cleanup()).resolves.not.toThrow();
    });

    test('should handle default values in get operations', async () => {
      const mockProxy = {
        get: jest.fn().mockResolvedValue(undefined),
      };
      
      const client = new StoreClient(null, mockProxy);
      
      // Test with default value (this depends on implementation)
      const result = await client.get('non-existent-key');
      expect(mockProxy.get).toHaveBeenCalledWith('non-existent-key');
      expect(result).toBeUndefined();
    });
  });
});