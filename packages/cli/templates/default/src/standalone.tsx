import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import {{APP_PASCAL_NAME}}App from './index';

// 简化的错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('应用错误:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('{{APP_DISPLAY_NAME}} 错误详情:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                应用加载失败
              </h1>
              <p className="text-gray-600 mb-4">
                应用遇到了一个错误，请尝试刷新页面。
              </p>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    this.setState({ hasError: false });
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
                <button 
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  重新开始
                </button>
              </div>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">错误详情</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 独立模式的简化启动
console.log('🚀 {{APP_DISPLAY_NAME}} 启动中...');

const StandaloneApp: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {/* 开发模式提示 */}
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 text-sm">🔧</span>
                <span className="text-blue-800 text-sm font-medium">
                  独立开发模式
                </span>
                <span className="text-blue-600 text-xs">
                  - {{APP_DISPLAY_NAME}}
                </span>
              </div>
              <div className="text-xs text-blue-600">
                {window.location.href}
              </div>
            </div>
          </div>
          
          {/* 主应用内容 */}
          <div className="container mx-auto px-4 py-6">
            <{{APP_PASCAL_NAME}}App />
          </div>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

// 启动应用
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(<StandaloneApp />);