// 只导入类型定义，避免循环依赖
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface {{APP_PASCAL_NAME}}Data {
  todos: Todo[];
  categories: string[];
  totalCount: number;
  completedCount: number;
  lastUpdated: string;
}

export interface {{APP_PASCAL_NAME}}Settings {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  autoSave?: boolean;
  notifications?: boolean;
  defaultPriority?: 'low' | 'medium' | 'high';
  showCompleted?: boolean;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'alphabetical';
  debugMode?: boolean;
}

class {{APP_PASCAL_NAME}}ServiceClass {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('初始化 {{APP_DISPLAY_NAME}} 服务...');
    
    // 初始化逻辑
    await this.loadSettings();
    await this.loadTodos();
    
    this.initialized = true;
  }

  cleanup(): void {
    console.log('清理 {{APP_DISPLAY_NAME}} 服务...');
    this.initialized = false;
  }

  async getData(): Promise<{{APP_PASCAL_NAME}}Data> {
    // 加载待办事项数据
    const todos = await this.loadTodos();
    const categories = await this.loadCategories();
    
    return {
      todos,
      categories,
      totalCount: todos.length,
      completedCount: todos.filter(todo => todo.completed).length,
      lastUpdated: new Date().toISOString()
    };
  }

  async loadTodos(): Promise<Todo[]> {
    try {
      const data = localStorage.getItem('{{APP_NAME}}_todos');
      if (data) {
        return JSON.parse(data);
      }
      
      // 返回一些示例数据
      return [
        {
          id: 'todo_1',
          title: '欢迎使用{{APP_DISPLAY_NAME}}！',
          description: '这是一个示例待办事项，您可以编辑或删除它。',
          completed: false,
          priority: 'medium' as const,
          category: '个人',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'todo_2',
          title: '点击左侧复选框完成任务',
          description: '试试看！完成后的任务会显示删除线。',
          completed: false,
          priority: 'low' as const,
          category: '学习',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    } catch (error) {
      console.error('加载待办事项失败:', error);
      return [];
    }
  }

  async saveTodos(todos: Todo[]): Promise<void> {
    try {
      localStorage.setItem('{{APP_NAME}}_todos', JSON.stringify(todos));
      console.log('待办事项已保存');
    } catch (error) {
      console.error('保存待办事项失败:', error);
      throw new Error('保存失败');
    }
  }

  async loadCategories(): Promise<string[]> {
    try {
      const data = localStorage.getItem('{{APP_NAME}}_categories');
      if (data) {
        return JSON.parse(data);
      }
      return ['工作', '个人', '学习', '购物'];
    } catch (error) {
      console.error('加载分类失败:', error);
      return ['工作', '个人', '学习', '购物'];
    }
  }

  async saveCategories(categories: string[]): Promise<void> {
    try {
      localStorage.setItem('{{APP_NAME}}_categories', JSON.stringify(categories));
      console.log('分类已保存');
    } catch (error) {
      console.error('保存分类失败:', error);
    }
  }

  async loadSettings(): Promise<{{APP_PASCAL_NAME}}Settings> {
    try {
      const data = localStorage.getItem('{{APP_NAME}}_settings');
      if (data) {
        return JSON.parse(data);
      }
      
      // 返回默认设置
      const defaultSettings: {{APP_PASCAL_NAME}}Settings = {
        theme: 'light',
        language: 'zh-CN',
        autoSave: true,
        notifications: true,
        defaultPriority: 'medium',
        showCompleted: true,
        sortBy: 'createdAt',
        debugMode: false
      };
      
      // 保存默认设置
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('加载设置失败:', error);
      return {
        theme: 'light',
        language: 'zh-CN',
        autoSave: true,
        notifications: true,
        defaultPriority: 'medium',
        showCompleted: true,
        sortBy: 'createdAt',
        debugMode: false
      };
    }
  }

  async saveSettings(settings: {{APP_PASCAL_NAME}}Settings): Promise<void> {
    try {
      localStorage.setItem('{{APP_NAME}}_settings', JSON.stringify(settings));
      console.log('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  // 导出数据
  async exportData(): Promise<string> {
    const todos = await this.loadTodos();
    const categories = await this.loadCategories();
    const settings = await this.loadSettings();
    
    const exportData = {
      todos,
      categories,
      settings,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // 导入数据
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.todos) {
        await this.saveTodos(data.todos);
      }
      
      if (data.categories) {
        await this.saveCategories(data.categories);
      }
      
      if (data.settings) {
        await this.saveSettings(data.settings);
      }
      
      console.log('数据导入成功');
    } catch (error) {
      console.error('数据导入失败:', error);
      throw new Error('导入数据格式错误');
    }
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem('{{APP_NAME}}_todos');
      localStorage.removeItem('{{APP_NAME}}_categories');
      localStorage.removeItem('{{APP_NAME}}_settings');
      console.log('所有数据已清空');
    } catch (error) {
      console.error('清空数据失败:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const {{APP_CAMEL_NAME}}Service = new {{APP_PASCAL_NAME}}ServiceClass();