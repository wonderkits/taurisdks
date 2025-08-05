import { AppConfig } from '@magicteam/core/types';
import { {{APP_PASCAL_NAME}}Icon } from './components/icons/{{APP_PASCAL_NAME}}Icon';

export const {{APP_CAMEL_NAME}}AppConfig: AppConfig = {
  manifest: {
    id: '{{APP_ID}}',
    name: '{{APP_NAME}}',
    displayName: '{{APP_DISPLAY_NAME}}',
    version: '1.0.0',
    description: '{{APP_DESCRIPTION}}',
    author: '{{APP_AUTHOR}}',
    category: '{{APP_CATEGORY}}',
    // keywords: ['{{APP_CATEGORY}}', '应用']
    // 暂时移除 keywords 和 permissions，因为类型定义不支持
  },
  
  navigation: {
    name: "{{APP_DISPLAY_NAME}}",
    href: "/{{APP_NAME}}",
    icon: {{APP_PASCAL_NAME}}Icon,
    order: 5,
    visible: true,
  },
  
  routes: [
    {
      path: '{{APP_NAME}}',
      lazy: () => import('./index').then(m => ({ Component: m.default })),
      meta: {
        title: '{{APP_DISPLAY_NAME}}',
        requireAuth: true,
        layout: 'default'
      },
      children: [
        {
          path: '',
          lazy: () => import('./components/Dashboard').then(m => ({ Component: m.default })),
          meta: {
            title: '{{APP_DISPLAY_NAME}}列表'
          }
        },
        {
          path: 'settings',
          lazy: () => import('./components/Settings').then(m => ({ Component: m.default })),
          meta: {
            title: '设置'
          }
        }
      ]
    }
  ],
  
  hooks: {
    async onInstall() {
      console.log('{{APP_DISPLAY_NAME}} 正在安装...');
    },
    
    async onActivate() {
      console.log('{{APP_DISPLAY_NAME}} 正在激活...');
      // 初始化应用服务
      const { {{APP_CAMEL_NAME}}Service } = await import('./services/{{APP_CAMEL_NAME}}Service');
      await {{APP_CAMEL_NAME}}Service.initialize();
    },
    
    async onDeactivate() {
      console.log('{{APP_DISPLAY_NAME}} 正在停用...');
      // 清理资源
      const { {{APP_CAMEL_NAME}}Service } = await import('./services/{{APP_CAMEL_NAME}}Service');
      {{APP_CAMEL_NAME}}Service.cleanup();
    },
    
    async onUninstall() {
      console.log('{{APP_DISPLAY_NAME}} 正在卸载...');
    }
  },
  
  entry: () => import('./index').then(m => m.default)
};