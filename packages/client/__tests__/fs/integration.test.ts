/**
 * FS Plugin Integration Tests
 * 
 * 测试 FsClient 与真实服务的集成功能
 * 需要后端 HTTP 服务运行在 localhost:1420
 */

import { FsClient, WonderKitsClient } from '../../src';
import { resolve } from 'path';

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

describe('FS Plugin Integration Tests', () => {
  let serviceAvailable = false;

  beforeAll(async () => {
    serviceAvailable = await isServiceAvailable();
    if (!serviceAvailable) {
      console.warn('⚠️  Backend service not available at localhost:1420, skipping integration tests');
    }
  });

  describeIf(serviceAvailable)('Service Connectivity', () => {
    test('should connect to backend service', async () => {
      const client = new FsClient('http://localhost:1420');
      
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

  describeIf(serviceAvailable)('Text File Operations', () => {
    let client: FsClient;
    const testDir = 'test_fs_integration';
    const testFile = `${testDir}/test.txt`;

    beforeEach(async () => {
      client = new FsClient('http://localhost:1420');
      
      // Clean up: remove test directory if exists
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
      } catch {
        // Ignore errors
      }
      
      // Create test directory
      try {
        await client.mkdir(testDir, { recursive: true });
      } catch {
        // Ignore errors if already exists
      }
    });

    afterEach(async () => {
      // Clean up
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        await client.cleanup();
      } catch {
        // Ignore errors
      }
    });

    test('should write and read text files', async () => {
      const content = 'Hello, World!\\nThis is a test file.\\n测试中文内容';
      
      // Write file
      await client.writeTextFile(testFile, content);
      
      // Verify file exists
      expect(await client.exists(testFile)).toBe(true);
      
      // Read file
      const readContent = await client.readTextFile(testFile);
      expect(readContent).toBe(content);
    });

    test('should handle Unicode content', async () => {
      const unicodeContent = '🚀 Hello World! 你好世界! 🌍\\n' +
        'Emoji: 😀😃😄😁😆😅\\n' +
        'Special chars: αβγδε ñáéíóú çãõ\\n' +
        'Math: ∀x∈ℝ: x²≥0';
      
      await client.writeTextFile(testFile, unicodeContent);
      const readContent = await client.readTextFile(testFile);
      
      expect(readContent).toBe(unicodeContent);
    });

    test('should handle empty files', async () => {
      await client.writeTextFile(testFile, '');
      
      expect(await client.exists(testFile)).toBe(true);
      
      const content = await client.readTextFile(testFile);
      expect(content).toBe('');
    });

    test('should handle large text files', async () => {
      // Generate large content (1MB)
      const line = 'This is a test line with some content to make it longer.\\n';
      const largeContent = line.repeat(10000); // ~500KB
      
      await client.writeTextFile(testFile, largeContent);
      const readContent = await client.readTextFile(testFile);
      
      expect(readContent).toBe(largeContent);
      expect(readContent.length).toBe(largeContent.length);
    });
  });

  describeIf(serviceAvailable)('Binary File Operations', () => {
    let client: FsClient;
    const testDir = 'test_fs_binary';
    const testFile = `${testDir}/test.bin`;

    beforeEach(async () => {
      client = new FsClient('http://localhost:1420');
      
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        await client.mkdir(testDir, { recursive: true });
      } catch {
        // Ignore setup errors
      }
    });

    afterEach(async () => {
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        await client.cleanup();
      } catch {
        // Ignore cleanup errors
      }
    });

    test('should write and read binary files', async () => {
      const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE, 0xFD, 0xFC]);
      
      await client.writeBinaryFile(testFile, binaryData);
      
      expect(await client.exists(testFile)).toBe(true);
      
      const readData = await client.readBinaryFile(testFile);
      expect(readData).toEqual(binaryData);
    });

    test('should handle empty binary files', async () => {
      const emptyData = new Uint8Array(0);
      
      await client.writeBinaryFile(testFile, emptyData);
      
      expect(await client.exists(testFile)).toBe(true);
      
      const readData = await client.readBinaryFile(testFile);
      expect(readData).toEqual(emptyData);
    });

    test('should handle large binary files', async () => {
      // Create 1MB of test data
      const largeData = new Uint8Array(1024 * 1024);
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256;
      }
      
      await client.writeBinaryFile(testFile, largeData);
      const readData = await client.readBinaryFile(testFile);
      
      expect(readData).toEqual(largeData);
      expect(readData.length).toBe(largeData.length);
    });
  });

  describeIf(serviceAvailable)('Directory Operations', () => {
    let client: FsClient;
    const baseDir = 'test_fs_directories';

    beforeEach(async () => {
      client = new FsClient('http://localhost:1420');
      
      try {
        if (await client.exists(baseDir)) {
          await client.remove(baseDir, { recursive: true });
        }
      } catch {
        // Ignore setup errors
      }
    });

    afterEach(async () => {
      try {
        if (await client.exists(baseDir)) {
          await client.remove(baseDir, { recursive: true });
        }
        await client.cleanup();
      } catch {
        // Ignore cleanup errors
      }
    });

    test('should create and remove directories', async () => {
      const dir = `${baseDir}/testdir`;
      
      expect(await client.exists(dir)).toBe(false);
      
      await client.mkdir(dir, { recursive: true });
      
      expect(await client.exists(dir)).toBe(true);
      
      await client.remove(dir);
      
      expect(await client.exists(dir)).toBe(false);
    });

    test('should create nested directories', async () => {
      const nestedDir = `${baseDir}/level1/level2/level3`;
      
      await client.mkdir(nestedDir, { recursive: true });
      
      expect(await client.exists(nestedDir)).toBe(true);
      expect(await client.exists(`${baseDir}/level1`)).toBe(true);
      expect(await client.exists(`${baseDir}/level1/level2`)).toBe(true);
    });

    test('should read directory contents', async () => {
      await client.mkdir(baseDir, { recursive: true });
      
      // Create some files and directories
      await client.writeTextFile(`${baseDir}/file1.txt`, 'content1');
      await client.writeTextFile(`${baseDir}/file2.txt`, 'content2');
      await client.mkdir(`${baseDir}/subdir1`);
      await client.mkdir(`${baseDir}/subdir2`);
      
      const entries = await client.readDir(baseDir);
      
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(4);
      
      const names = entries.map(entry => entry.name).sort();
      expect(names).toEqual(['file1.txt', 'file2.txt', 'subdir1', 'subdir2']);
      
      // Check entry properties
      const file1Entry = entries.find(e => e.name === 'file1.txt');
      expect(file1Entry).toBeDefined();
      expect(file1Entry?.isFile).toBe(true);
      expect(file1Entry?.isDir).toBe(false);
      
      const subdirEntry = entries.find(e => e.name === 'subdir1');
      expect(subdirEntry).toBeDefined();
      expect(subdirEntry?.isFile).toBe(false);
      expect(subdirEntry?.isDir).toBe(true);
    });

    test('should handle empty directories', async () => {
      const emptyDir = `${baseDir}/empty`;
      
      await client.mkdir(emptyDir, { recursive: true });
      
      const entries = await client.readDir(emptyDir);
      expect(entries).toEqual([]);
    });
  });

  describeIf(serviceAvailable)('File Operations', () => {
    let client: FsClient;
    const testDir = 'test_fs_operations';

    beforeEach(async () => {
      client = new FsClient('http://localhost:1420');
      
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        await client.mkdir(testDir, { recursive: true });
      } catch {
        // Ignore setup errors
      }
    });

    afterEach(async () => {
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        await client.cleanup();
      } catch {
        // Ignore cleanup errors
      }
    });

    test('should copy files', async () => {
      const sourceFile = `${testDir}/source.txt`;
      const destFile = `${testDir}/dest.txt`;
      const content = 'File to be copied';
      
      await client.writeTextFile(sourceFile, content);
      
      expect(await client.exists(destFile)).toBe(false);
      
      await client.copyFile(sourceFile, destFile);
      
      expect(await client.exists(destFile)).toBe(true);
      
      const copiedContent = await client.readTextFile(destFile);
      expect(copiedContent).toBe(content);
      
      // Original file should still exist
      expect(await client.exists(sourceFile)).toBe(true);
    });

    test('should rename files', async () => {
      const oldName = `${testDir}/old.txt`;
      const newName = `${testDir}/new.txt`;
      const content = 'File to be renamed';
      
      await client.writeTextFile(oldName, content);
      
      expect(await client.exists(oldName)).toBe(true);
      expect(await client.exists(newName)).toBe(false);
      
      await client.rename(oldName, newName);
      
      expect(await client.exists(oldName)).toBe(false);
      expect(await client.exists(newName)).toBe(true);
      
      const renamedContent = await client.readTextFile(newName);
      expect(renamedContent).toBe(content);
    });

    test('should remove files', async () => {
      const file = `${testDir}/to_remove.txt`;
      
      await client.writeTextFile(file, 'This will be removed');
      
      expect(await client.exists(file)).toBe(true);
      
      await client.remove(file);
      
      expect(await client.exists(file)).toBe(false);
    });

    test('should create empty files', async () => {
      const emptyFile = `${testDir}/empty.txt`;
      
      expect(await client.exists(emptyFile)).toBe(false);
      
      await client.create(emptyFile);
      
      expect(await client.exists(emptyFile)).toBe(true);
      
      const content = await client.readTextFile(emptyFile);
      expect(content).toBe('');
    });
  });

  describeIf(serviceAvailable)('File Metadata', () => {
    let client: FsClient;
    const testDir = 'test_fs_metadata';
    const testFile = `${testDir}/metadata_test.txt`;

    beforeEach(async () => {
      client = new FsClient('http://localhost:1420');
      
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        await client.mkdir(testDir, { recursive: true });
        await client.writeTextFile(testFile, 'Test content for metadata');
      } catch {
        // Ignore setup errors
      }
    });

    afterEach(async () => {
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        await client.cleanup();
      } catch {
        // Ignore cleanup errors
      }
    });

    test('should get file statistics', async () => {
      const stat = await client.stat(testFile);
      
      expect(stat).toBeDefined();
      expect(typeof stat).toBe('object');
      expect(stat).toHaveProperty('isFile');
      expect(stat).toHaveProperty('isDir');
      expect(stat).toHaveProperty('size');
      
      expect(stat.isFile).toBe(true);
      expect(stat.isDir).toBe(false);
      expect(stat.size).toBeGreaterThan(0);
      
      // Check timestamps (should be defined and reasonable)
      if (stat.modified) {
        expect(stat.modified instanceof Date || typeof stat.modified === 'string').toBe(true);
      }
    });

    test('should get directory statistics', async () => {
      const stat = await client.stat(testDir);
      
      expect(stat).toBeDefined();
      expect(stat.isFile).toBe(false);
      expect(stat.isDir).toBe(true);
    });

    test('should handle lstat for symbolic links', async () => {
      // lstat should work the same as stat for regular files
      const lstat = await client.lstat(testFile);
      
      expect(lstat).toBeDefined();
      expect(lstat.isFile).toBe(true);
      expect(lstat.isDir).toBe(false);
    });

    test('should truncate files', async () => {
      const originalContent = 'This is a long file content that will be truncated';
      await client.writeTextFile(testFile, originalContent);
      
      const originalStat = await client.stat(testFile);
      expect(originalStat.size).toBe(originalContent.length);
      
      // Truncate to 10 bytes
      await client.truncate(testFile, 10);
      
      const newStat = await client.stat(testFile);
      expect(newStat.size).toBe(10);
      
      const truncatedContent = await client.readTextFile(testFile);
      expect(truncatedContent).toBe(originalContent.substring(0, 10));
    });
  });

  describeIf(serviceAvailable)('Error Handling', () => {
    let client: FsClient;

    beforeEach(async () => {
      client = new FsClient('http://localhost:1420');
    });

    afterEach(async () => {
      await client.cleanup();
    });

    test('should handle reading non-existent files', async () => {
      await expect(client.readTextFile('non-existent-file.txt')).rejects.toThrow();
    });

    test('should handle writing to invalid paths', async () => {
      // Try to write to a path that doesn't exist (without recursive)
      await expect(client.writeTextFile('/invalid/path/file.txt', 'content')).rejects.toThrow();
    });

    test('should handle operations on non-existent directories', async () => {
      await expect(client.readDir('non-existent-directory')).rejects.toThrow();
    });

    test('should handle stat on non-existent files', async () => {
      await expect(client.stat('non-existent-file.txt')).rejects.toThrow();
    });

    test('should handle removing non-existent files', async () => {
      await expect(client.remove('non-existent-file.txt')).rejects.toThrow();
    });
  });

  describeIf(serviceAvailable)('Unified Client Integration', () => {
    test('should work through WonderKitsClient', async () => {
      const client = await WonderKitsClient.create();
      const fs = client.fs({
        httpBaseUrl: 'http://localhost:1420'
      });
      
      expect(fs).toBeDefined();
      expect(typeof fs.readTextFile).toBe('function');
      expect(typeof fs.writeTextFile).toBe('function');
      expect(typeof fs.exists).toBe('function');
      
      const testDir = 'test_unified_fs';
      const testFile = `${testDir}/unified_test.txt`;
      
      try {
        if (await fs.exists(testDir)) {
          await fs.remove(testDir, { recursive: true });
        }
        
        await fs.mkdir(testDir, { recursive: true });
        await fs.writeTextFile(testFile, 'Unified client test');
        
        expect(await fs.exists(testFile)).toBe(true);
        
        const content = await fs.readTextFile(testFile);
        expect(content).toBe('Unified client test');
      } finally {
        try {
          if (await fs.exists(testDir)) {
            await fs.remove(testDir, { recursive: true });
          }
        } catch {
          // Ignore cleanup errors
        }
        await client.cleanup();
      }
    });

    test('should maintain service lifecycle', async () => {
      const client = await WonderKitsClient.create();
      
      // Should be able to get FS service multiple times
      const fs1 = client.fs({});
      const fs2 = client.fs({});
      
      expect(fs1).toBeDefined();
      expect(fs2).toBeDefined();
      // Same configuration should return same instance
      expect(fs1).toBe(fs2);
      
      await client.cleanup();
    });
  });

  describeIf(serviceAvailable)('Performance', () => {
    test('should handle concurrent operations', async () => {
      const client = new FsClient('http://localhost:1420');
      const testDir = 'test_fs_concurrent';
      
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        await client.mkdir(testDir, { recursive: true });
        
        // Create multiple files concurrently
        const promises = Array.from({ length: 5 }, (_, i) =>
          client.writeTextFile(`${testDir}/file${i}.txt`, `Content ${i}`)
        );
        
        await Promise.all(promises);
        
        // Verify all files exist
        for (let i = 0; i < 5; i++) {
          expect(await client.exists(`${testDir}/file${i}.txt`)).toBe(true);
          const content = await client.readTextFile(`${testDir}/file${i}.txt`);
          expect(content).toBe(`Content ${i}`);
        }
      } finally {
        try {
          if (await client.exists(testDir)) {
            await client.remove(testDir, { recursive: true });
          }
        } catch {
          // Ignore cleanup errors
        }
        await client.cleanup();
      }
    });

    test('should have reasonable response times', async () => {
      const client = new FsClient('http://localhost:1420');
      const testDir = 'test_fs_performance';
      const testFile = `${testDir}/perf_test.txt`;
      
      try {
        if (await client.exists(testDir)) {
          await client.remove(testDir, { recursive: true });
        }
        
        const start = Date.now();
        
        await client.mkdir(testDir, { recursive: true });
        await client.writeTextFile(testFile, 'Performance test content');
        const content = await client.readTextFile(testFile);
        const exists = await client.exists(testFile);
        
        const duration = Date.now() - start;
        
        expect(content).toBe('Performance test content');
        expect(exists).toBe(true);
        expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      } finally {
        try {
          if (await client.exists(testDir)) {
            await client.remove(testDir, { recursive: true });
          }
        } catch {
          // Ignore cleanup errors
        }
        await client.cleanup();
      }
    });
  });
});