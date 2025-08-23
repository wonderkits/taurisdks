/**
 * Store Plugin Integration Tests
 * 
 * 测试 StoreClient 与真实服务的集成功能
 * 需要后端 HTTP 服务运行在 localhost:1420
 */

import { StoreClient, WonderKitsClient } from '../../src';

// Check if backend service is available
const isServiceAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:1420/health');
    return response.ok;
  } catch {
    return false;
  }
};

const describeIf = (condition: boolean) => condition ? describe : describe.skip;

describe('Store Plugin Integration Tests', () => {
  let serviceAvailable = false;

  beforeAll(async () => {
    serviceAvailable = await isServiceAvailable();
    if (!serviceAvailable) {
      console.warn('⚠️  Backend service not available at localhost:1420, skipping integration tests');
    }
  });

  describeIf(serviceAvailable)('Service Connectivity', () => {
    test('should connect to backend service', async () => {
      const client = new StoreClient('http://localhost:1420');
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isReady()).toBe(true);
    });

    test('should perform basic health check', async () => {
      const response = await fetch('http://localhost:1420/health');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
    });
  });

  describeIf(serviceAvailable)('Basic Store Operations', () => {
    let client: StoreClient;
    const testStore = 'test_integration.store';

    beforeEach(async () => {
      client = new StoreClient('http://localhost:1420', null, testStore);
      
      // Clean up: clear store
      try {
        await client.clear();
      } catch {
        // Ignore errors
      }
    });

    afterEach(async () => {
      // Clean up
      try {
        await client.clear();
        await client.cleanup();
      } catch {
        // Ignore errors
      }
    });

    test('should set and get values', async () => {
      // Set a string value
      await client.set('test-key', 'test-value');
      
      // Get the value
      const value = await client.get('test-key');
      expect(value).toBe('test-value');
    });

    test('should handle different data types', async () => {
      const testData = {
        string: 'hello world',
        number: 42,
        boolean: true,
        null: null,
        object: { nested: { value: 123 } },
        array: [1, 2, 3, 'four'],
      };

      // Set different types
      for (const [key, value] of Object.entries(testData)) {
        await client.set(key, value);
      }

      // Verify all types are stored and retrieved correctly
      for (const [key, expectedValue] of Object.entries(testData)) {
        const retrievedValue = await client.get(key);
        expect(retrievedValue).toEqual(expectedValue);
      }
    });

    test('should check if keys exist', async () => {
      await client.set('existing-key', 'some-value');
      
      expect(await client.has('existing-key')).toBe(true);
      expect(await client.has('non-existing-key')).toBe(false);
    });

    test('should delete keys', async () => {
      await client.set('to-delete', 'will-be-deleted');
      
      expect(await client.has('to-delete')).toBe(true);
      
      const deleted = await client.delete('to-delete');
      expect(deleted).toBe(true);
      expect(await client.has('to-delete')).toBe(false);
      
      // Deleting non-existing key should return false
      const notDeleted = await client.delete('non-existing');
      expect(notDeleted).toBe(false);
    });

    test('should clear all data', async () => {
      await client.set('key1', 'value1');
      await client.set('key2', 'value2');
      await client.set('key3', 'value3');
      
      const lengthBefore = await client.length();
      expect(lengthBefore).toBe(3);
      
      await client.clear();
      
      const lengthAfter = await client.length();
      expect(lengthAfter).toBe(0);
    });
  });

  describeIf(serviceAvailable)('Store Iteration', () => {
    let client: StoreClient;
    const testStore = 'test_iteration.store';

    beforeEach(async () => {
      client = new StoreClient('http://localhost:1420', null, testStore);
      
      // Setup test data
      await client.clear();
      await client.set('key1', 'value1');
      await client.set('key2', 'value2');
      await client.set('key3', 'value3');
    });

    afterEach(async () => {
      await client.clear();
      await client.cleanup();
    });

    test('should get all keys', async () => {
      const keys = await client.keys();
      
      expect(Array.isArray(keys)).toBe(true);
      expect(keys).toHaveLength(3);
      expect(keys.sort()).toEqual(['key1', 'key2', 'key3']);
    });

    test('should get all values', async () => {
      const values = await client.values();
      
      expect(Array.isArray(values)).toBe(true);
      expect(values).toHaveLength(3);
      expect(values.sort()).toEqual(['value1', 'value2', 'value3']);
    });

    test('should get all entries', async () => {
      const entries = await client.entries();
      
      expect(Array.isArray(entries)).toBe(true);
      expect(entries).toHaveLength(3);
      
      const entriesMap = new Map(entries);
      expect(entriesMap.get('key1')).toBe('value1');
      expect(entriesMap.get('key2')).toBe('value2');
      expect(entriesMap.get('key3')).toBe('value3');
    });

    test('should get correct length', async () => {
      const length = await client.length();
      expect(length).toBe(3);
      
      await client.set('key4', 'value4');
      expect(await client.length()).toBe(4);
      
      await client.delete('key1');
      expect(await client.length()).toBe(3);
    });
  });

  describeIf(serviceAvailable)('Persistence Operations', () => {
    let client: StoreClient;
    const testStore = 'test_persistence.store';

    beforeEach(async () => {
      client = new StoreClient('http://localhost:1420', null, testStore);
      await client.clear();
    });

    afterEach(async () => {
      await client.clear();
      await client.cleanup();
    });

    test('should save data to file', async () => {
      await client.set('persistent-key', 'persistent-value');
      
      // Save should not throw
      await expect(client.save()).resolves.not.toThrow();
    });

    test('should load data from file', async () => {
      // Set some data and save
      await client.set('key1', 'value1');
      await client.set('key2', 'value2');
      await client.save();
      
      // Clear in-memory data
      await client.clear();
      expect(await client.length()).toBe(0);
      
      // Load should restore data
      await client.load();
      
      expect(await client.length()).toBe(2);
      expect(await client.get('key1')).toBe('value1');
      expect(await client.get('key2')).toBe('value2');
    });

    test('should reset store to initial state', async () => {
      await client.set('temp-key', 'temp-value');
      await client.save();
      
      expect(await client.length()).toBe(1);
      
      await client.reset();
      
      expect(await client.length()).toBe(0);
    });
  });

  describeIf(serviceAvailable)('Multiple Store Instances', () => {
    test('should handle multiple independent stores', async () => {
      const store1 = new StoreClient('http://localhost:1420', null, 'store1.store');
      const store2 = new StoreClient('http://localhost:1420', null, 'store2.store');

      try {
        // Clear both stores
        await store1.clear();
        await store2.clear();

        // Set different data in each store
        await store1.set('store1-key', 'store1-value');
        await store2.set('store2-key', 'store2-value');

        // Verify isolation
        expect(await store1.get('store1-key')).toBe('store1-value');
        expect(await store1.has('store2-key')).toBe(false);
        
        expect(await store2.get('store2-key')).toBe('store2-value');
        expect(await store2.has('store1-key')).toBe(false);

        expect(await store1.length()).toBe(1);
        expect(await store2.length()).toBe(1);
      } finally {
        await store1.clear();
        await store2.clear();
        await store1.cleanup();
        await store2.cleanup();
      }
    });
  });

  describeIf(serviceAvailable)('Error Handling', () => {
    let client: StoreClient;

    beforeEach(async () => {
      client = new StoreClient('http://localhost:1420', null, 'test_errors.store');
      await client.clear();
    });

    afterEach(async () => {
      await client.clear();
      await client.cleanup();
    });

    test('should handle getting non-existent keys', async () => {
      const value = await client.get('non-existent-key');
      expect(value).toBeUndefined();
    });

    test('should handle operations on empty store', async () => {
      expect(await client.length()).toBe(0);
      expect(await client.keys()).toEqual([]);
      expect(await client.values()).toEqual([]);
      expect(await client.entries()).toEqual([]);
    });

    test('should handle invalid key names gracefully', async () => {
      // Test empty string key
      try {
        await client.set('', 'empty-key-value');
        const value = await client.get('');
        expect(value).toBe('empty-key-value');
      } catch (error) {
        // Implementation may reject empty keys
        expect(error).toBeDefined();
      }
      
      // Test very long key
      const longKey = 'a'.repeat(1000);
      await client.set(longKey, 'long-key-value');
      const longValue = await client.get(longKey);
      expect(longValue).toBe('long-key-value');
    });
  });

  describeIf(serviceAvailable)('Unified Client Integration', () => {
    test('should work through WonderKitsClient', async () => {
      const client = await WonderKitsClient.create();
      const store = client.store({
        filename: 'test_unified.store',
        httpBaseUrl: 'http://localhost:1420'
      });
      
      expect(store).toBeDefined();
      expect(typeof store.get).toBe('function');
      expect(typeof store.set).toBe('function');
      
      try {
        await store.clear();
        
        await store.set('unified-key', 'unified-value');
        const value = await store.get('unified-key');
        expect(value).toBe('unified-value');
        
        expect(await store.length()).toBe(1);
        expect(await store.has('unified-key')).toBe(true);
      } finally {
        await store.clear();
        await client.cleanup();
      }
    });

    test('should maintain service lifecycle', async () => {
      const client = await WonderKitsClient.create();
      
      // Should be able to get Store service multiple times
      const store1 = client.store({ filename: 'test1.store' });
      const store2 = client.store({ filename: 'test2.store' });
      
      expect(store1).toBeDefined();
      expect(store2).toBeDefined();
      expect(store1).not.toBe(store2); // Different instances for different configs
      
      await client.cleanup();
    });
  });

  describeIf(serviceAvailable)('Performance', () => {
    test('should handle concurrent operations', async () => {
      const client = new StoreClient('http://localhost:1420', null, 'test_concurrent.store');
      
      try {
        await client.clear();
        
        // Execute multiple set operations concurrently
        const promises = Array.from({ length: 10 }, (_, i) =>
          client.set(`key${i}`, `value${i}`)
        );
        
        await Promise.all(promises);
        
        expect(await client.length()).toBe(10);
        
        // Verify all values
        for (let i = 0; i < 10; i++) {
          const value = await client.get(`key${i}`);
          expect(value).toBe(`value${i}`);
        }
      } finally {
        await client.clear();
        await client.cleanup();
      }
    });

    test('should have reasonable response times', async () => {
      const client = new StoreClient('http://localhost:1420', null, 'test_perf.store');
      
      try {
        await client.clear();
        
        const start = Date.now();
        
        await client.set('perf-key', 'perf-value');
        const value = await client.get('perf-key');
        const keys = await client.keys();
        
        const duration = Date.now() - start;
        
        expect(value).toBe('perf-value');
        expect(keys).toContain('perf-key');
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      } finally {
        await client.clear();
        await client.cleanup();
      }
    });

    test('should handle large data efficiently', async () => {
      const client = new StoreClient('http://localhost:1420', null, 'test_large.store');
      
      try {
        await client.clear();
        
        // Create large object
        const largeData = {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: `This is item number ${i}`.repeat(10)
          }))
        };
        
        await client.set('large-data', largeData);
        const retrieved = await client.get('large-data');
        
        expect(retrieved).toEqual(largeData);
        expect(retrieved.items).toHaveLength(1000);
      } finally {
        await client.clear();
        await client.cleanup();
      }
    });
  });
});