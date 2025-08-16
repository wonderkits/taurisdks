/**
 * Wujie 微前端集成
 * 
 * 提供 Wujie 环境的类型声明和工具函数
 * 简化子应用的 Wujie 集成开发
 * 
 * @version 1.0.0
 * @license MIT
 */

// Wujie 类型声明
declare global {
  interface Window {
    // Wujie 运行标识
    __POWERED_BY_WUJIE__?: boolean;
    
    // Wujie 生命周期钩子
    __WUJIE_MOUNT?: () => void;
    __WUJIE_UNMOUNT?: () => void;
    
    // Wujie 提供的父应用通信接口
    $wujie?: {
      props: Record<string, any>;
      id: string;
      url: string;
      // 向父应用发送消息
      bus: {
        $emit: (event: string, data: any) => void;
        $on: (event: string, callback: (...args: any[]) => void) => void;
        $off: (event: string, callback?: (...args: any[]) => void) => void;
      };
    };
  }
}

/**
 * Wujie 工具函数
 */
export const WujieUtils = {
  /**
   * 检查是否在 Wujie 环境中运行
   */
  isInWujie(): boolean {
    return !!(window.__POWERED_BY_WUJIE__);
  },

  /**
   * 获取父应用传递的 props
   */
  getParentProps(): Record<string, any> | undefined {
    return window.$wujie?.props;
  },

  /**
   * 向父应用发送消息
   */
  emitToParent(event: string, data: any): void {
    if (this.isInWujie() && window.$wujie?.bus) {
      window.$wujie.bus.$emit(event, data);
    } else {
      console.warn('不在 Wujie 环境中，无法发送消息到父应用');
    }
  },

  /**
   * 监听父应用消息
   */
  onParentMessage(event: string, callback: (...args: any[]) => void): void {
    if (this.isInWujie() && window.$wujie?.bus) {
      window.$wujie.bus.$on(event, callback);
    }
  },

  /**
   * 取消监听父应用消息
   */
  offParentMessage(event: string, callback?: (...args: any[]) => void): void {
    if (this.isInWujie() && window.$wujie?.bus) {
      window.$wujie.bus.$off(event, callback);
    }
  },

  /**
   * 获取当前子应用的信息
   */
  getAppInfo(): WujieAppInfo {
    if (!this.isInWujie()) {
      return { mode: 'standalone' as const };
    }

    return {
      mode: 'wujie' as const,
      id: window.$wujie?.id,
      url: window.$wujie?.url,
      props: this.getParentProps()
    };
  }
};

// 导出类型
export interface WujieAppInfo {
  mode: 'wujie' | 'standalone';
  id?: string;
  url?: string;
  props?: Record<string, any>;
}

// Wujie 配置类型
export interface WujieConfig {
  name?: string;
  url: string;
  props?: Record<string, any>;
  attrs?: Record<string, any>;
  replace?: boolean;
  sync?: boolean;
  prefix?: {
    'prefix-url'?: string;
    'prefix-class'?: string;
  };
  alive?: boolean;
  sandbox?: boolean;
  fetch?: (url: string, options?: any) => Promise<Response>;
  plugins?: Array<{ htmlLoader?: Function; jsLoader?: Function; cssLoader?: Function }>;
  beforeLoad?: (appWindow: Window) => void;
  beforeMount?: (appWindow: Window) => void;
  afterMount?: (appWindow: Window) => void;
  beforeUnmount?: (appWindow: Window) => void;
  afterUnmount?: (appWindow: Window) => void;
  activated?: () => void;
  deactivated?: () => void;
}

/**
 * Wujie 应用生命周期管理器
 */
export class WujieAppManager {
  private appRoot: any = null;
  private renderFunction: () => any;
  private destroyFunction: (root: any) => void;

  constructor(
    renderFunction: () => any,
    destroyFunction: (root: any) => void = (root) => root?.unmount?.()
  ) {
    this.renderFunction = renderFunction;
    this.destroyFunction = destroyFunction;
  }

  /**
   * 初始化 Wujie 应用
   * 自动处理 Wujie 环境和独立运行模式
   */
  init(): void {
    if (WujieUtils.isInWujie()) {
      console.log('子应用运行在 Wujie 环境中');
      this.setupWujieHooks();
    } else {
      console.log('子应用独立运行模式');
      this.renderApp();
    }
  }

  /**
   * 设置 Wujie 生命周期钩子
   */
  private setupWujieHooks(): void {
    // Wujie 挂载钩子
    window.__WUJIE_MOUNT = () => {
      console.log('子应用 Wujie 挂载');
      this.appRoot = this.renderApp();
      
      // 获取主应用传递的属性
      const props = WujieUtils.getParentProps();
      if (props) {
        console.log('主应用传递的属性:', props);
      }
      
      // 监听主应用路由变化
      WujieUtils.onParentMessage('parent-route-change', (data: any) => {
        console.log('主应用路由变化:', data);
      });
    };

    // Wujie 卸载钩子
    window.__WUJIE_UNMOUNT = () => {
      console.log('子应用 Wujie 卸载');
      this.destroyApp();
    };
  }

  /**
   * 渲染应用
   */
  private renderApp(): any {
    try {
      return this.renderFunction();
    } catch (error) {
      console.error('应用渲染失败:', error);
      throw error;
    }
  }

  /**
   * 销毁应用
   */
  private destroyApp(): void {
    if (this.appRoot) {
      try {
        this.destroyFunction(this.appRoot);
      } catch (error) {
        console.error('应用销毁失败:', error);
      } finally {
        this.appRoot = null;
      }
    }
  }
}

/**
 * 创建 Wujie 应用管理器的便捷函数
 */
export function createWujieApp(
  renderFunction: () => any,
  destroyFunction?: (root: any) => void
): WujieAppManager {
  return new WujieAppManager(renderFunction, destroyFunction);
}

export default WujieUtils;