/**
 * Tauri FS Plugin Universal Client
 * 提供与 @tauri-apps/plugin-fs 完全一致的 API，支持多种运行模式
 * @magicteam/client
 */

import type { BaseClient, BaseClientOptions, ClientMode, ApiResponse } from '../core/types';
import {
  environmentDetector,
  fetchWithErrorHandling,
  importTauriPlugin,
  retryWithFallback,
  logger,
  ApiPathManager,
} from '../core/utils';

// FS 特定类型定义
export interface FsClientInitOptions extends BaseClientOptions {
  // FS 特定选项可以在这里扩展
}

export interface FileInfo {
  isFile: boolean;
  isDir: boolean;
  isSymlink: boolean;
  size: number;
  modified?: number;
  accessed?: number;
  created?: number;
  readonly: boolean;
}

export interface MkdirOptions {
  recursive?: boolean;
}

export interface DirEntry {
  name: string;
  path: string;
  isFile: boolean;
  isDir: boolean;
  size: number;
}

/**
 * 文件系统客户端类
 * 支持 Tauri 原生、主应用代理、HTTP 服务三种模式
 */
export class FsClient implements BaseClient {
  readonly isHttpMode: boolean;
  readonly isProxyMode: boolean;
  readonly isTauriNative: boolean;
  private apiPathManager?: ApiPathManager;

  constructor(
    private httpBaseUrl: string | null = null,
    private fsProxy: any = null
  ) {
    this.isHttpMode = !!httpBaseUrl;
    this.isProxyMode = !!fsProxy;
    this.isTauriNative = !httpBaseUrl && !fsProxy;

    // 初始化 API 路径管理器
    if (this.httpBaseUrl) {
      this.apiPathManager = new ApiPathManager(this.httpBaseUrl);
    }
  }

  /**
   * 初始化 FS 客户端 - 完全兼容 @tauri-apps/plugin-fs API
   */
  static async init(options: FsClientInitOptions = {}): Promise<FsClient> {
    const { httpBaseUrl } = options;

    if (httpBaseUrl) {
      // 显式指定 HTTP 模式
      logger.info('显式使用 FS HTTP 模式');
      return new FsClient(httpBaseUrl);
    }

    // 智能检测 FS 可用模式
    const fsMode = FsClient.detectFsMode();

    switch (fsMode) {
      case 'tauri-native':
        logger.info('使用 Tauri 原生 FS 插件');
        return new FsClient();

      case 'tauri-proxy':
        logger.info('使用主应用 FS 代理');
        const fsProxy = window.$wujie?.props?.tauriFs;
        return new FsClient(null, fsProxy);

      case 'http':
      default:
        logger.info('使用 HTTP FS 服务');
        return new FsClient('http://localhost:1421');
    }
  }

  /**
   * 读取文本文件 - 兼容 @tauri-apps/plugin-fs API
   */
  async readTextFile(path: string): Promise<string> {
    if (this.isHttpMode) {
      return await this.readTextFileViaHttp(path);
    } else if (this.isProxyMode) {
      return await this.readTextFileViaProxy(path);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.readTextFile(path);
    }
  }

  private async readTextFileViaProxy(path: string): Promise<string> {
    const result = await this.fsProxy.readTextFile(path);
    return result.content;
  }

  private async readTextFileViaHttp(path: string): Promise<string> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.readText(), {
      method: 'POST',
      body: JSON.stringify({ path }),
    });

    const result: ApiResponse<{ content: string }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to read text file');
    }

    return result.data!.content;
  }

  /**
   * 写入文本文件 - 兼容 @tauri-apps/plugin-fs API
   */
  async writeTextFile(path: string, content: string): Promise<void> {
    if (this.isHttpMode) {
      return await this.writeTextFileViaHttp(path, content);
    } else if (this.isProxyMode) {
      return await this.writeTextFileViaProxy(path, content);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.writeTextFile(path, content);
    }
  }

  private async writeTextFileViaProxy(path: string, content: string): Promise<void> {
    await this.fsProxy.writeTextFile(path, content);
  }

  private async writeTextFileViaHttp(path: string, content: string): Promise<void> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.writeText(), {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    });

    const result: ApiResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to write text file');
    }
  }

  /**
   * 读取二进制文件 - 兼容 @tauri-apps/plugin-fs API
   */
  async readBinaryFile(path: string): Promise<Uint8Array> {
    if (this.isHttpMode) {
      return await this.readBinaryFileViaHttp(path);
    } else if (this.isProxyMode) {
      return await this.readBinaryFileViaProxy(path);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.readFile(path);
    }
  }

  private async readBinaryFileViaProxy(path: string): Promise<Uint8Array> {
    const result = await this.fsProxy.readBinaryFile(path);
    return new Uint8Array(result.content);
  }

  private async readBinaryFileViaHttp(path: string): Promise<Uint8Array> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.readBinary(), {
      method: 'POST',
      body: JSON.stringify({ path }),
    });

    const result: ApiResponse<{ content: number[] }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to read binary file');
    }

    return new Uint8Array(result.data!.content);
  }

  /**
   * 写入二进制文件 - 兼容 @tauri-apps/plugin-fs API
   */
  async writeBinaryFile(path: string, content: Uint8Array | number[]): Promise<void> {
    const contentArray = Array.from(content);

    if (this.isHttpMode) {
      return await this.writeBinaryFileViaHttp(path, contentArray);
    } else if (this.isProxyMode) {
      return await this.writeBinaryFileViaProxy(path, contentArray);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.writeFile(path, content);
    }
  }

  private async writeBinaryFileViaProxy(path: string, content: number[]): Promise<void> {
    await this.fsProxy.writeBinaryFile(path, content);
  }

  private async writeBinaryFileViaHttp(path: string, content: number[]): Promise<void> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.writeBinary(), {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    });

    const result: ApiResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to write binary file');
    }
  }

  /**
   * 检查文件/目录是否存在 - 兼容 @tauri-apps/plugin-fs API
   */
  async exists(path: string): Promise<boolean> {
    if (this.isHttpMode) {
      return await this.existsViaHttp(path);
    } else if (this.isProxyMode) {
      return await this.existsViaProxy(path);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.exists(path);
    }
  }

  private async existsViaProxy(path: string): Promise<boolean> {
    const result = await this.fsProxy.exists(path);
    return result.exists;
  }

  private async existsViaHttp(path: string): Promise<boolean> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.exists(), {
      method: 'POST',
      body: JSON.stringify({ path }),
    });

    const result: ApiResponse<{ exists: boolean }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to check file exists');
    }

    return result.data!.exists;
  }

  /**
   * 获取文件/目录信息 - 兼容 @tauri-apps/plugin-fs API
   */
  async stat(path: string): Promise<FileInfo> {
    if (this.isHttpMode) {
      return await this.statViaHttp(path);
    } else if (this.isProxyMode) {
      return await this.statViaProxy(path);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.stat(path);
    }
  }

  private async statViaProxy(path: string): Promise<FileInfo> {
    const result = await this.fsProxy.stat(path);
    return result.metadata;
  }

  private async statViaHttp(path: string): Promise<FileInfo> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.metadata(), {
      method: 'POST',
      body: JSON.stringify({ path }),
    });

    const result: ApiResponse<{ metadata: FileInfo }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get file metadata');
    }

    return result.data!.metadata;
  }

  /**
   * 创建目录 - 兼容 @tauri-apps/plugin-fs API
   */
  async mkdir(path: string, options: MkdirOptions = {}): Promise<void> {
    const recursive = options.recursive || false;

    if (this.isHttpMode) {
      return await this.mkdirViaHttp(path, recursive);
    } else if (this.isProxyMode) {
      return await this.mkdirViaProxy(path, recursive);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.mkdir(path, { recursive });
    }
  }

  private async mkdirViaProxy(path: string, recursive: boolean): Promise<void> {
    await this.fsProxy.mkdir(path, recursive);
  }

  private async mkdirViaHttp(path: string, recursive: boolean): Promise<void> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.createDir(), {
      method: 'POST',
      body: JSON.stringify({ path, recursive }),
    });

    const result: ApiResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to create directory');
    }
  }

  /**
   * 删除文件 - 兼容 @tauri-apps/plugin-fs API
   */
  async remove(path: string): Promise<void> {
    if (this.isHttpMode) {
      return await this.removeViaHttp(path);
    } else if (this.isProxyMode) {
      return await this.removeViaProxy(path);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.remove(path);
    }
  }

  private async removeViaProxy(path: string): Promise<void> {
    await this.fsProxy.remove(path);
  }

  private async removeViaHttp(path: string): Promise<void> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.removeFile(), {
      method: 'POST',
      body: JSON.stringify({ path }),
    });

    const result: ApiResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to remove file');
    }
  }

  /**
   * 读取目录内容 - 兼容 @tauri-apps/plugin-fs API
   */
  async readDir(path: string): Promise<DirEntry[]> {
    if (this.isHttpMode) {
      return await this.readDirViaHttp(path);
    } else if (this.isProxyMode) {
      return await this.readDirViaProxy(path);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.readDir(path);
    }
  }

  private async readDirViaProxy(path: string): Promise<DirEntry[]> {
    const result = await this.fsProxy.readDir(path);
    return result.entries;
  }

  private async readDirViaHttp(path: string): Promise<DirEntry[]> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.readDir(), {
      method: 'POST',
      body: JSON.stringify({ path }),
    });

    const result: ApiResponse<{ entries: DirEntry[] }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to read directory');
    }

    return result.data!.entries;
  }

  /**
   * 复制文件 - 兼容 @tauri-apps/plugin-fs API
   */
  async copyFile(source: string, destination: string): Promise<void> {
    if (this.isHttpMode) {
      return await this.copyFileViaHttp(source, destination);
    } else if (this.isProxyMode) {
      return await this.copyFileViaProxy(source, destination);
    } else {
      // Tauri 原生模式
      const fsModule = await importTauriPlugin<any>('@tauri-apps/plugin-fs');
      return await fsModule.copyFile(source, destination);
    }
  }

  private async copyFileViaProxy(source: string, destination: string): Promise<void> {
    await this.fsProxy.copyFile(source, destination);
  }

  private async copyFileViaHttp(source: string, destination: string): Promise<void> {
    const response = await fetchWithErrorHandling(this.apiPathManager!.fs.copyFile(), {
      method: 'POST',
      body: JSON.stringify({ fromPath: source, toPath: destination }),
    });

    const result: ApiResponse = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to copy file');
    }
  }

  /**
   * 智能检测 FS 插件的可用方式
   */
  static detectFsMode(): ClientMode {
    const baseMode = environmentDetector.detectMode();

    // 对于 tauri-proxy 模式，需要进一步检测代理是否可用
    if (baseMode === 'tauri-proxy') {
      if (window.$wujie?.props?.tauriFs) {
        logger.debug('检测到 Wujie 环境，发现主应用 FS 代理');
        return 'tauri-proxy';
      } else {
        logger.debug('检测到 Wujie 环境，但无 FS 代理，使用 HTTP 服务');
        return 'http';
      }
    }

    return baseMode;
  }
}

// 默认导出
export default FsClient;
