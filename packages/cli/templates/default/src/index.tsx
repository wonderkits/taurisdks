import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';

// 简单的错误边界和调试组件
const DebugWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError] = React.useState(false);
  const [showSimple, setShowSimple] = React.useState(false);

  React.useEffect(() => {
    console.log('🏠 {{APP_PASCAL_NAME}}App 组件已加载');
  }, []);

  if (hasError || showSimple) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {{APP_DISPLAY_NAME}}
            </h1>
            <p className="text-gray-600 mb-6">
              独立开发模式运行中
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm text-green-800">✅ 应用已成功启动</p>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">🔧 开发模式已激活</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  onClick={() => setShowSimple(false)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  切换到完整版
                </button>
                <button 
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="{{APP_NAME}}-app">
      <div className="mb-4">
        <button 
          onClick={() => setShowSimple(true)}
          className="text-xs text-gray-400 underline"
        >
          切换到简单模式
        </button>
      </div>
      {children}
    </div>
  );
};

const {{APP_PASCAL_NAME}}App: React.FC = () => {
  console.log('🎯 渲染 {{APP_PASCAL_NAME}}App 主组件');
  
  return (
    <DebugWrapper>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">页面未找到</h2>
            <p className="text-gray-600 mt-2">当前路径: {window.location.pathname}</p>
            <button 
              onClick={() => window.history.pushState({}, '', '/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              返回首页
            </button>
          </div>
        } />
      </Routes>
    </DebugWrapper>
  );
};

export default {{APP_PASCAL_NAME}}App;