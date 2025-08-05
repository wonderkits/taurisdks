import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { {{APP_CAMEL_NAME}}Service, Todo, {{APP_PASCAL_NAME}}Data, {{APP_PASCAL_NAME}}Settings } from '../services/{{APP_CAMEL_NAME}}Service';

// 重新导出类型供组件使用
export type { Todo, {{APP_PASCAL_NAME}}Data, {{APP_PASCAL_NAME}}Settings };

interface {{APP_PASCAL_NAME}}State {
  // 数据状态
  data: {{APP_PASCAL_NAME}}Data | null;
  isLoading: boolean;
  error: string | null;
  
  // 设置状态
  settings: {{APP_PASCAL_NAME}}Settings;
  
  // 基础操作方法
  loadData: () => Promise<void>;
  updateData: (data: {{APP_PASCAL_NAME}}Data) => void;
  updateSettings: (settings: {{APP_PASCAL_NAME}}Settings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 待办事项操作方法
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  
  // 获取方法
  getTodos: () => Todo[];
  getFilteredTodos: (filter?: { category?: string; completed?: boolean; priority?: string }) => Todo[];
}

export const use{{APP_PASCAL_NAME}}Store = create<{{APP_PASCAL_NAME}}State>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    data: {
      todos: [],
      categories: ['工作', '个人', '学习', '购物'],
      totalCount: 0,
      completedCount: 0,
      lastUpdated: new Date().toISOString()
    },
    isLoading: false,
    error: null,
    settings: {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      notifications: true,
      defaultPriority: 'medium',
      showCompleted: true,
      sortBy: 'createdAt',
      debugMode: false
    },

    // 操作方法
    loadData: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const data = await {{APP_CAMEL_NAME}}Service.getData();
        set({ data, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '加载数据失败';
        set({ error: errorMessage, isLoading: false });
      }
    },

    updateData: (data: {{APP_PASCAL_NAME}}Data) => {
      set({ data });
    },

    updateSettings: (newSettings: {{APP_PASCAL_NAME}}Settings) => {
      const currentSettings = get().settings;
      const updatedSettings = { ...currentSettings, ...newSettings };
      set({ settings: updatedSettings });
      
      // 持久化设置
      {{APP_CAMEL_NAME}}Service.saveSettings(updatedSettings);
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    // 待办事项操作方法
    addTodo: async (todoData) => {
      try {
        const now = new Date().toISOString();
        const newTodo: Todo = {
          ...todoData,
          id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now
        };

        const currentData = get().data;
        if (currentData) {
          const updatedTodos = [...currentData.todos, newTodo];
          const updatedData = {
            ...currentData,
            todos: updatedTodos,
            totalCount: updatedTodos.length,
            completedCount: updatedTodos.filter(t => t.completed).length,
            lastUpdated: now
          };
          
          set({ data: updatedData });
          await {{APP_CAMEL_NAME}}Service.saveTodos(updatedTodos);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '添加待办事项失败';
        set({ error: errorMessage });
      }
    },

    updateTodo: async (id, updates) => {
      try {
        const currentData = get().data;
        if (currentData) {
          const now = new Date().toISOString();
          const updatedTodos = currentData.todos.map(todo =>
            todo.id === id ? { ...todo, ...updates, updatedAt: now } : todo
          );
          
          const updatedData = {
            ...currentData,
            todos: updatedTodos,
            completedCount: updatedTodos.filter(t => t.completed).length,
            lastUpdated: now
          };
          
          set({ data: updatedData });
          await {{APP_CAMEL_NAME}}Service.saveTodos(updatedTodos);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '更新待办事项失败';
        set({ error: errorMessage });
      }
    },

    deleteTodo: async (id) => {
      try {
        const currentData = get().data;
        if (currentData) {
          const updatedTodos = currentData.todos.filter(todo => todo.id !== id);
          const now = new Date().toISOString();
          
          const updatedData = {
            ...currentData,
            todos: updatedTodos,
            totalCount: updatedTodos.length,
            completedCount: updatedTodos.filter(t => t.completed).length,
            lastUpdated: now
          };
          
          set({ data: updatedData });
          await {{APP_CAMEL_NAME}}Service.saveTodos(updatedTodos);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '删除待办事项失败';
        set({ error: errorMessage });
      }
    },

    toggleTodo: async (id) => {
      try {
        const currentData = get().data;
        if (currentData) {
          const todo = currentData.todos.find(t => t.id === id);
          if (todo) {
            await get().updateTodo(id, { completed: !todo.completed });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '切换待办事项状态失败';
        set({ error: errorMessage });
      }
    },

    addCategory: (category) => {
      const currentData = get().data;
      if (currentData && !currentData.categories.includes(category)) {
        const updatedData = {
          ...currentData,
          categories: [...currentData.categories, category],
          lastUpdated: new Date().toISOString()
        };
        set({ data: updatedData });
        {{APP_CAMEL_NAME}}Service.saveCategories(updatedData.categories);
      }
    },

    removeCategory: (category) => {
      const currentData = get().data;
      if (currentData) {
        const updatedData = {
          ...currentData,
          categories: currentData.categories.filter(c => c !== category),
          lastUpdated: new Date().toISOString()
        };
        set({ data: updatedData });
        {{APP_CAMEL_NAME}}Service.saveCategories(updatedData.categories);
      }
    },

    // 获取方法
    getTodos: () => {
      const data = get().data;
      return data ? data.todos : [];
    },

    getFilteredTodos: (filter = {}) => {
      const data = get().data;
      if (!data) return [];

      let todos = data.todos;

      if (filter.category) {
        todos = todos.filter(todo => todo.category === filter.category);
      }

      if (typeof filter.completed === 'boolean') {
        todos = todos.filter(todo => todo.completed === filter.completed);
      }

      if (filter.priority) {
        todos = todos.filter(todo => todo.priority === filter.priority);
      }

      // 根据设置排序
      const sortBy = get().settings.sortBy || 'createdAt';
      todos.sort((a, b) => {
        switch (sortBy) {
          case 'priority':
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          case 'alphabetical':
            return a.title.localeCompare(b.title);
          case 'createdAt':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });

      return todos;
    }
  }))
);

// 订阅设置变化，实现自动保存
use{{APP_PASCAL_NAME}}Store.subscribe(
  (state) => state.settings,
  (settings) => {
    if (settings.autoSave) {
      {{APP_CAMEL_NAME}}Service.saveSettings(settings);
    }
  }
);