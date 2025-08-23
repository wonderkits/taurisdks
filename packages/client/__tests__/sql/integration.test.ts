/**
 * SQL Plugin Integration Tests
 * 
 * 测试 SqlClient 与真实服务的集成功能
 * 需要后端 HTTP 服务运行在 localhost:1420
 */

import { SqlClient, WonderKitsClient } from '../../src';

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

describe('SQL Plugin Integration Tests', () => {
  let serviceAvailable = false;

  beforeAll(async () => {
    serviceAvailable = await isServiceAvailable();
    if (!serviceAvailable) {
      console.warn('⚠️  Backend service not available at localhost:1420, skipping integration tests');
    }
  });

  describeIf(serviceAvailable)('Service Connectivity', () => {
    test('should connect to backend service', async () => {
      const client = new SqlClient('http://localhost:1420');
      
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

  describeIf(serviceAvailable)('Database Operations', () => {
    let client: SqlClient;
    const testDb = 'test_integration.db';

    beforeEach(async () => {
      client = new SqlClient('http://localhost:1420', null, testDb);
      
      // Clean up: drop test table if exists
      try {
        await client.execute('DROP TABLE IF EXISTS test_users');
      } catch {
        // Ignore errors
      }
    });

    afterEach(async () => {
      // Clean up: drop test table
      try {
        await client.execute('DROP TABLE IF EXISTS test_users');
        await client.close();
      } catch {
        // Ignore errors
      }
    });

    test('should create table and insert data', async () => {
      // Create table
      const createResult = await client.execute(
        'CREATE TABLE test_users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)'
      );
      
      expect(createResult).toHaveProperty('rowsAffected');
      expect(createResult.rowsAffected).toBe(0); // CREATE TABLE doesn't affect rows

      // Insert data
      const insertResult = await client.execute(
        'INSERT INTO test_users (name, email) VALUES (?, ?)',
        ['John Doe', 'john@example.com']
      );
      
      expect(insertResult).toHaveProperty('rowsAffected');
      expect(insertResult.rowsAffected).toBe(1);
      expect(insertResult).toHaveProperty('lastInsertId');
    });

    test('should select data correctly', async () => {
      // Setup: create table and insert test data
      await client.execute(
        'CREATE TABLE test_users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)'
      );
      await client.execute(
        'INSERT INTO test_users (name, email) VALUES (?, ?)',
        ['Alice', 'alice@example.com']
      );
      await client.execute(
        'INSERT INTO test_users (name, email) VALUES (?, ?)',
        ['Bob', 'bob@example.com']
      );

      // Test select all
      const allUsers = await client.select('SELECT * FROM test_users ORDER BY id');
      
      expect(Array.isArray(allUsers)).toBe(true);
      expect(allUsers).toHaveLength(2);
      expect(allUsers[0]).toMatchObject({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com'
      });
      expect(allUsers[1]).toMatchObject({
        id: 2,
        name: 'Bob',
        email: 'bob@example.com'
      });
    });

    test('should handle parameterized queries', async () => {
      // Setup
      await client.execute(
        'CREATE TABLE test_users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)'
      );
      await client.execute(
        'INSERT INTO test_users (name, age) VALUES (?, ?)',
        ['Alice', 25]
      );
      await client.execute(
        'INSERT INTO test_users (name, age) VALUES (?, ?)',
        ['Bob', 30]
      );

      // Test parameterized select
      const result = await client.select(
        'SELECT * FROM test_users WHERE age > ? ORDER BY age',
        [25]
      );
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Bob',
        age: 30
      });
    });

    test('should handle transactions (if supported)', async () => {
      await client.execute(
        'CREATE TABLE test_users (id INTEGER PRIMARY KEY, name TEXT)'
      );

      // Insert multiple records
      await client.execute('INSERT INTO test_users (name) VALUES (?)', ['User1']);
      await client.execute('INSERT INTO test_users (name) VALUES (?)', ['User2']);
      await client.execute('INSERT INTO test_users (name) VALUES (?)', ['User3']);

      const users = await client.select('SELECT COUNT(*) as count FROM test_users');
      expect(users[0]).toHaveProperty('count', 3);
    });

    test('should handle errors gracefully', async () => {
      // Test invalid SQL
      await expect(client.execute('INVALID SQL STATEMENT')).rejects.toThrow();
      
      // Test select from non-existent table
      await expect(client.select('SELECT * FROM non_existent_table')).rejects.toThrow();
    });

    test('should support different data types', async () => {
      await client.execute(`
        CREATE TABLE test_types (
          id INTEGER PRIMARY KEY,
          text_col TEXT,
          integer_col INTEGER,
          real_col REAL,
          blob_col BLOB
        )
      `);

      const testData = {
        text_col: 'Hello World',
        integer_col: 42,
        real_col: 3.14159,
        blob_col: null // SQLite BLOB handling may vary
      };

      await client.execute(
        'INSERT INTO test_types (text_col, integer_col, real_col, blob_col) VALUES (?, ?, ?, ?)',
        [testData.text_col, testData.integer_col, testData.real_col, testData.blob_col]
      );

      const result = await client.select('SELECT * FROM test_types WHERE id = 1');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        text_col: testData.text_col,
        integer_col: testData.integer_col,
        real_col: testData.real_col
      });
    });
  });

  describeIf(serviceAvailable)('Connection Management', () => {
    test('should handle multiple connections', async () => {
      const client1 = new SqlClient('http://localhost:1420', null, 'test1.db');
      const client2 = new SqlClient('http://localhost:1420', null, 'test2.db');

      try {
        // Both clients should work independently
        await client1.execute('CREATE TABLE test1 (id INTEGER)');
        await client2.execute('CREATE TABLE test2 (id INTEGER)');
        
        await client1.execute('INSERT INTO test1 VALUES (1)');
        await client2.execute('INSERT INTO test2 VALUES (2)');
        
        const result1 = await client1.select('SELECT * FROM test1');
        const result2 = await client2.select('SELECT * FROM test2');
        
        expect(result1[0].id).toBe(1);
        expect(result2[0].id).toBe(2);
      } finally {
        await client1.close();
        await client2.close();
      }
    });

    test('should handle connection cleanup', async () => {
      const client = new SqlClient('http://localhost:1420', null, 'test_cleanup.db');
      
      // Use the connection
      await client.execute('CREATE TABLE test_cleanup (id INTEGER)');
      
      // Clean up should not throw
      await expect(client.cleanup()).resolves.not.toThrow();
      await expect(client.close()).resolves.not.toThrow();
    });
  });

  describeIf(serviceAvailable)('Unified Client Integration', () => {
    test('should work through WonderKitsClient', async () => {
      const client = await WonderKitsClient.create();
      const sql = client.sql({
        connectionString: 'sqlite:test_unified.db',
        httpBaseUrl: 'http://localhost:1420'
      });
      
      expect(sql).toBeDefined();
      expect(typeof sql.execute).toBe('function');
      expect(typeof sql.select).toBe('function');
      
      try {
        await sql.execute('CREATE TABLE test_unified (id INTEGER)');
        await sql.execute('INSERT INTO test_unified VALUES (1)');
        
        const result = await sql.select('SELECT * FROM test_unified');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
      } finally {
        await sql.close();
        await client.cleanup();
      }
    });

    test('should maintain service lifecycle', async () => {
      const client = await WonderKitsClient.create();
      
      // Should be able to get SQL service multiple times
      const sql1 = client.sql({ connectionString: 'sqlite:test1.db' });
      const sql2 = client.sql({ connectionString: 'sqlite:test2.db' });
      
      expect(sql1).toBeDefined();
      expect(sql2).toBeDefined();
      expect(sql1).not.toBe(sql2); // Different instances for different configs
      
      await client.cleanup();
    });
  });

  describeIf(serviceAvailable)('Performance', () => {
    test('should handle concurrent queries', async () => {
      const client = new SqlClient('http://localhost:1420', null, 'test_concurrent.db');
      
      try {
        await client.execute('CREATE TABLE test_concurrent (id INTEGER, value TEXT)');
        
        // Execute multiple queries concurrently
        const promises = Array.from({ length: 5 }, (_, i) =>
          client.execute('INSERT INTO test_concurrent (id, value) VALUES (?, ?)', [i, `value${i}`])
        );
        
        const results = await Promise.all(promises);
        results.forEach(result => {
          expect(result.rowsAffected).toBe(1);
        });
        
        const allData = await client.select('SELECT * FROM test_concurrent ORDER BY id');
        expect(allData).toHaveLength(5);
      } finally {
        await client.close();
      }
    });

    test('should have reasonable response times', async () => {
      const client = new SqlClient('http://localhost:1420', null, 'test_perf.db');
      
      try {
        const start = Date.now();
        
        await client.execute('CREATE TABLE test_perf (id INTEGER)');
        await client.execute('INSERT INTO test_perf VALUES (1)');
        const result = await client.select('SELECT * FROM test_perf');
        
        const duration = Date.now() - start;
        
        expect(result).toHaveLength(1);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      } finally {
        await client.close();
      }
    });
  });
});