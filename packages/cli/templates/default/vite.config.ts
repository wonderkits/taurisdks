import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isStandalone = mode === 'standalone';
  const isLibrary = mode === 'library' || mode === 'production';
  
  if (isLibrary) {
    // 集成模式：构建为库
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/app.config.ts'),
          name: '{{APP_PASCAL_NAME}}',
          fileName: (format) => `{{APP_NAME}}.${format}.js`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          // 外部化依赖，不打包进库中
          external: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          output: {
            globals: {
              'react': 'React',
              'react-dom': 'ReactDOM',
              'react-router-dom': 'ReactRouterDOM',
              'zustand': 'zustand'
            },
            // 保持干净的输出文件名
            entryFileNames: '[name].js',
            chunkFileNames: 'chunks/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash].[ext]'
          }
        },
        outDir: 'dist/lib',
        emptyOutDir: true
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
          '@magicteam/core': resolve(__dirname, 'packages/core/src')
        }
      }
    };
  }
  
  // 独立模式：标准SPA应用
  return {
    plugins: [react()],
    
    // 标准SPA配置
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, 'index.html'),
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      }
    },
    
    // 开发服务器配置（标准SPA）
    server: {
      port: 3001,
      host: '0.0.0.0',
      open: true,
      // SPA fallback，所有路由都返回index.html
      historyApiFallback: true
    },
    
    // 预览服务器配置
    preview: {
      port: 3001,
      host: '0.0.0.0',
      open: true
    },
    
    // 环境变量
    define: {
      __DEV_MODE__: JSON.stringify(mode),
      __IS_STANDALONE__: JSON.stringify(isStandalone)
    },
    
    // 路径解析
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@magicteam/core': resolve(__dirname, 'packages/core/src')
      }
    }
  };
});