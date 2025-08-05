import React, { useState } from 'react';
import { use{{APP_PASCAL_NAME}}Store } from '../stores/{{APP_CAMEL_NAME}}Store';

const Settings: React.FC = () => {
  const { settings, updateSettings } = use{{APP_PASCAL_NAME}}Store();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const handleReset = () => {
    const defaultSettings = {
      theme: 'light' as const,
      language: 'zh-CN',
      autoSave: true,
      notifications: true,
      defaultPriority: 'medium' as const,
      showCompleted: true,
      sortBy: 'createdAt' as const,
      debugMode: false
    };
    setLocalSettings(defaultSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">应用设置</h2>
        <p className="mt-1 text-sm text-gray-600">
          自定义{{APP_DISPLAY_NAME}}的显示和行为设置
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            基础设置
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                应用主题
              </label>
              <select
                value={localSettings.theme || 'light'}
                onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                语言设置
              </label>
              <select
                value={localSettings.language || 'zh-CN'}
                onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.autoSave ?? true}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoSave: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">自动保存数据</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.notifications ?? true}
                  onChange={(e) => setLocalSettings({ ...localSettings, notifications: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">启用通知</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            待办事项设置
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                默认优先级
              </label>
              <select
                value={localSettings.defaultPriority || 'medium'}
                onChange={(e) => setLocalSettings({ ...localSettings, defaultPriority: e.target.value as 'low' | 'medium' | 'high' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                排序方式
              </label>
              <select
                value={localSettings.sortBy || 'createdAt'}
                onChange={(e) => setLocalSettings({ ...localSettings, sortBy: e.target.value as 'dueDate' | 'priority' | 'createdAt' | 'alphabetical' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">创建时间</option>
                <option value="dueDate">截止日期</option>
                <option value="priority">优先级</option>
                <option value="alphabetical">字母顺序</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.showCompleted ?? true}
                  onChange={(e) => setLocalSettings({ ...localSettings, showCompleted: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">显示已完成的待办事项</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.debugMode || false}
                  onChange={(e) => setLocalSettings({ ...localSettings, debugMode: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">调试模式</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={handleReset}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          重置为默认值
        </button>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          保存设置
        </button>
      </div>
    </div>
  );
};

export default Settings;