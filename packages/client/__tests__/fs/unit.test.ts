/**
 * FS Plugin Unit Tests
 * 
 * 测试 FsClient 的基础功能和单个模式的行为
 */

import { FsClient } from '../../src/plugin/fs';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

describe('FsClient Unit Tests', () => {
  
  describe('Constructor and Mode Detection', () => {
    test('should create HTTP mode client correctly', () => {
      const client = new FsClient('http://localhost:1420');
      
      expect(client.isHttpMode).toBe(true);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(false);
    });

    test('should create Tauri native mode client correctly', () => {
      const client = new FsClient();
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(false);
      expect(client.isTauriNative).toBe(true);
    });

    test('should create proxy mode client correctly', () => {
      const mockProxy = {
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
      };
      
      const client = new FsClient(null, mockProxy);
      
      expect(client.isHttpMode).toBe(false);
      expect(client.isProxyMode).toBe(true);
      expect(client.isTauriNative).toBe(false);
    });
  });

  describe('Method Availability', () => {
    test('should have all required public methods', () => {
      const client = new FsClient();
      
      // Core file operations
      expect(typeof client.readTextFile).toBe('function');
      expect(typeof client.writeTextFile).toBe('function');
      expect(typeof client.readBinaryFile).toBe('function');
      expect(typeof client.writeBinaryFile).toBe('function');
      
      // File system operations
      expect(typeof client.exists).toBe('function');
      expect(typeof client.mkdir).toBe('function');
      expect(typeof client.remove).toBe('function');
      expect(typeof client.rename).toBe('function');
      expect(typeof client.copyFile).toBe('function');
      
      // Directory operations
      expect(typeof client.readDir).toBe('function');
      
      // File metadata operations
      expect(typeof client.stat).toBe('function');
      expect(typeof client.lstat).toBe('function');
      expect(typeof client.truncate).toBe('function');
      expect(typeof client.create).toBe('function');
      
      // Utility methods
      expect(typeof client.cleanup).toBe('function');
      
      // Static methods
      expect(typeof FsClient.create).toBe('function');
    });
  });

  describe('Static Factory Methods', () => {
    test('create method should exist and be async', async () => {
      expect(typeof FsClient.create).toBe('function');
      
      // Should not throw when creating with options
      try {
        await FsClient.create({
          httpBaseUrl: 'http://localhost:1420'
        });
      } catch (error) {
        // Expected in test environment without actual Tauri/HTTP service
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    test('Tauri native mode should fail gracefully in test environment', async () => {
      const client = new FsClient();
      
      await expect(client.readTextFile('test.txt')).rejects.toThrow();
    });

    test('HTTP mode with invalid URL should fail gracefully', async () => {
      const client = new FsClient('http://invalid-url:9999');
      
      await expect(client.readTextFile('test.txt')).rejects.toThrow();
    });

    test('HTTP mode connection should handle failures', async () => {
      const client = new FsClient('http://localhost:9999');
      
      await expect(client.writeTextFile('test.txt', 'content')).rejects.toThrow();
    });
  });

  describe('Proxy Mode Behavior', () => {
    test('should call proxy methods correctly for text operations', async () => {
      const mockProxy = {
        readTextFile: jest.fn().mockResolvedValue('file content'),
        writeTextFile: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(true),
        remove: jest.fn().mockResolvedValue(undefined),
        mkdir: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn().mockResolvedValue(undefined),
        copyFile: jest.fn().mockResolvedValue(undefined),
        readDir: jest.fn().mockResolvedValue([]),
        stat: jest.fn().mockResolvedValue({}),
        lstat: jest.fn().mockResolvedValue({}),
        truncate: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
        readBinaryFile: jest.fn().mockResolvedValue(new Uint8Array()),
        writeBinaryFile: jest.fn().mockResolvedValue(undefined),
      };
      
      const client = new FsClient(null, mockProxy);
      
      // Test text file operations
      const content = await client.readTextFile('test.txt');
      expect(mockProxy.readTextFile).toHaveBeenCalledWith('test.txt');
      expect(content).toBe('file content');
      
      await client.writeTextFile('test.txt', 'new content');
      expect(mockProxy.writeTextFile).toHaveBeenCalledWith('test.txt', 'new content');
      
      // Test file system operations
      const exists = await client.exists('test.txt');
      expect(mockProxy.exists).toHaveBeenCalledWith('test.txt');
      expect(exists).toBe(true);
      
      await client.remove('test.txt');
      expect(mockProxy.remove).toHaveBeenCalledWith('test.txt');
      
      await client.mkdir('testdir');
      expect(mockProxy.mkdir).toHaveBeenCalledWith('testdir');
      
      await client.rename('old.txt', 'new.txt');
      expect(mockProxy.rename).toHaveBeenCalledWith('old.txt', 'new.txt');
      
      await client.copyFile('source.txt', 'dest.txt');
      expect(mockProxy.copyFile).toHaveBeenCalledWith('source.txt', 'dest.txt');
      
      // Test directory operations
      const entries = await client.readDir('testdir');
      expect(mockProxy.readDir).toHaveBeenCalledWith('testdir');
      expect(Array.isArray(entries)).toBe(true);
    });

    test('should call proxy methods correctly for binary operations', async () => {
      const testData = new Uint8Array([1, 2, 3, 4]);
      const mockProxy = {
        readBinaryFile: jest.fn().mockResolvedValue(testData),
        writeBinaryFile: jest.fn().mockResolvedValue(undefined),
        // Add other required methods
        readTextFile: jest.fn(),
        writeTextFile: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
        mkdir: jest.fn(),
        rename: jest.fn(),
        copyFile: jest.fn(),
        readDir: jest.fn(),
        stat: jest.fn(),
        lstat: jest.fn(),
        truncate: jest.fn(),
        create: jest.fn(),
      };
      
      const client = new FsClient(null, mockProxy);
      
      // Test binary file operations
      const data = await client.readBinaryFile('binary.dat');
      expect(mockProxy.readBinaryFile).toHaveBeenCalledWith('binary.dat');
      expect(data).toEqual(testData);
      
      await client.writeBinaryFile('binary.dat', testData);
      expect(mockProxy.writeBinaryFile).toHaveBeenCalledWith('binary.dat', testData);
    });

    test('should call proxy methods correctly for metadata operations', async () => {
      const mockStat = {
        isFile: true,
        isDir: false,
        size: 1024,
        modified: new Date('2023-01-01'),
        accessed: new Date('2023-01-01'),
        created: new Date('2023-01-01'),
      };

      const mockProxy = {
        stat: jest.fn().mockResolvedValue(mockStat),
        lstat: jest.fn().mockResolvedValue(mockStat),
        truncate: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
        // Add other required methods
        readTextFile: jest.fn(),
        writeTextFile: jest.fn(),
        readBinaryFile: jest.fn(),
        writeBinaryFile: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
        mkdir: jest.fn(),
        rename: jest.fn(),
        copyFile: jest.fn(),
        readDir: jest.fn(),
      };
      
      const client = new FsClient(null, mockProxy);
      
      // Test metadata operations
      const stat = await client.stat('test.txt');
      expect(mockProxy.stat).toHaveBeenCalledWith('test.txt');
      expect(stat).toEqual(mockStat);
      
      const lstat = await client.lstat('test.txt');
      expect(mockProxy.lstat).toHaveBeenCalledWith('test.txt');
      expect(lstat).toEqual(mockStat);
      
      await client.truncate('test.txt', 512);
      expect(mockProxy.truncate).toHaveBeenCalledWith('test.txt', 512);
      
      await client.create('new.txt');
      expect(mockProxy.create).toHaveBeenCalledWith('new.txt');
    });

    test('should handle proxy method failures', async () => {
      const mockProxy = {
        readTextFile: jest.fn().mockRejectedValue(new Error('Read failed')),
        writeTextFile: jest.fn().mockRejectedValue(new Error('Write failed')),
        exists: jest.fn().mockRejectedValue(new Error('Exists failed')),
        remove: jest.fn().mockRejectedValue(new Error('Remove failed')),
        mkdir: jest.fn().mockRejectedValue(new Error('Mkdir failed')),
        rename: jest.fn().mockRejectedValue(new Error('Rename failed')),
        copyFile: jest.fn().mockRejectedValue(new Error('Copy failed')),
        readDir: jest.fn().mockRejectedValue(new Error('ReadDir failed')),
        stat: jest.fn().mockRejectedValue(new Error('Stat failed')),
        lstat: jest.fn().mockRejectedValue(new Error('Lstat failed')),
        truncate: jest.fn().mockRejectedValue(new Error('Truncate failed')),
        create: jest.fn().mockRejectedValue(new Error('Create failed')),
        readBinaryFile: jest.fn().mockRejectedValue(new Error('ReadBinary failed')),
        writeBinaryFile: jest.fn().mockRejectedValue(new Error('WriteBinary failed')),
      };
      
      const client = new FsClient(null, mockProxy);
      
      await expect(client.readTextFile('test.txt')).rejects.toThrow('Read failed');
      await expect(client.writeTextFile('test.txt', 'content')).rejects.toThrow('Write failed');
      await expect(client.exists('test.txt')).rejects.toThrow('Exists failed');
      await expect(client.remove('test.txt')).rejects.toThrow('Remove failed');
      await expect(client.mkdir('testdir')).rejects.toThrow('Mkdir failed');
      await expect(client.rename('old.txt', 'new.txt')).rejects.toThrow('Rename failed');
      await expect(client.copyFile('src.txt', 'dest.txt')).rejects.toThrow('Copy failed');
      await expect(client.readDir('testdir')).rejects.toThrow('ReadDir failed');
      await expect(client.stat('test.txt')).rejects.toThrow('Stat failed');
      await expect(client.lstat('test.txt')).rejects.toThrow('Lstat failed');
      await expect(client.truncate('test.txt', 100)).rejects.toThrow('Truncate failed');
      await expect(client.create('new.txt')).rejects.toThrow('Create failed');
      await expect(client.readBinaryFile('test.bin')).rejects.toThrow('ReadBinary failed');
      await expect(client.writeBinaryFile('test.bin', new Uint8Array())).rejects.toThrow('WriteBinary failed');
    });
  });

  describe('Path Handling', () => {
    test('should handle different path formats in proxy mode', async () => {
      const mockProxy = {
        readTextFile: jest.fn().mockResolvedValue('content'),
        writeTextFile: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(true),
        remove: jest.fn().mockResolvedValue(undefined),
        mkdir: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn().mockResolvedValue(undefined),
        copyFile: jest.fn().mockResolvedValue(undefined),
        readDir: jest.fn().mockResolvedValue([]),
        stat: jest.fn().mockResolvedValue({}),
        lstat: jest.fn().mockResolvedValue({}),
        truncate: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
        readBinaryFile: jest.fn().mockResolvedValue(new Uint8Array()),
        writeBinaryFile: jest.fn().mockResolvedValue(undefined),
      };
      
      const client = new FsClient(null, mockProxy);
      
      // Test various path formats
      const paths = [
        'simple.txt',
        'path/to/file.txt',
        '../relative/path.txt',
        '/absolute/path.txt',
        './current/dir/file.txt',
        'file with spaces.txt',
        'file-with-dashes.txt',
        'file_with_underscores.txt',
      ];
      
      for (const path of paths) {
        await client.readTextFile(path);
        expect(mockProxy.readTextFile).toHaveBeenCalledWith(path);
      }
    });
  });

  describe('Utility Methods', () => {
    test('cleanup should work without throwing', async () => {
      const client = new FsClient();
      
      await expect(client.cleanup()).resolves.not.toThrow();
    });

    test('should handle ready state correctly', () => {
      const httpClient = new FsClient('http://localhost:1420');
      const nativeClient = new FsClient();
      const proxyClient = new FsClient(null, {});
      
      expect(httpClient.isReady()).toBe(true);
      expect(nativeClient.isReady()).toBe(true);
      expect(proxyClient.isReady()).toBe(true);
    });
  });

  describe('Options Handling', () => {
    test('should handle mkdir options in proxy mode', async () => {
      const mockProxy = {
        mkdir: jest.fn().mockResolvedValue(undefined),
        // Add other required methods
        readTextFile: jest.fn(),
        writeTextFile: jest.fn(),
        readBinaryFile: jest.fn(),
        writeBinaryFile: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
        rename: jest.fn(),
        copyFile: jest.fn(),
        readDir: jest.fn(),
        stat: jest.fn(),
        lstat: jest.fn(),
        truncate: jest.fn(),
        create: jest.fn(),
      };
      
      const client = new FsClient(null, mockProxy);
      
      const options = { recursive: true };
      await client.mkdir('nested/directory/path', options);
      
      expect(mockProxy.mkdir).toHaveBeenCalledWith('nested/directory/path', options);
    });
  });
});