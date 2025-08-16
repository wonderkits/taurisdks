import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const external = [
  '@tauri-apps/plugin-sql',
  '@tauri-apps/plugin-store', 
  '@tauri-apps/plugin-fs',
  '@tauri-apps/api/path',
  'react',
  'react-dom',
  'zustand'
];

const createConfig = (input, outputName) => [
  // ESM and CJS builds
  {
    input,
    output: [
      {
        file: `dist/${outputName}.js`,
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: `dist/${outputName}.esm.js`,
        format: 'esm',
        sourcemap: true
      }
    ],
    external,
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // We'll generate types separately
        declarationMap: false, // Disable since declaration is false
        sourceMap: true
      })
    ]
  },
  // Type definitions
  {
    input,
    output: {
      file: `dist/${outputName}.d.ts`,
      format: 'esm'
    },
    external,
    plugins: [
      dts()
    ]
  }
];

export default [
  // Main index
  ...createConfig('src/index.ts', 'index'),
  
  // Core domain
  ...createConfig('src/core/index.ts', 'core/index'),
  
  // Plugin domain (Tauri plugins)
  ...createConfig('src/plugin/index.ts', 'plugin/index'),
  ...createConfig('src/plugin/sql.ts', 'plugin/sql'),
  ...createConfig('src/plugin/store.ts', 'plugin/store'),
  ...createConfig('src/plugin/fs.ts', 'plugin/fs'),
  
  // Microapp domain
  ...createConfig('src/microapp/index.ts', 'microapp/index'),
  
  // Framework domain
  ...createConfig('src/framework/index.ts', 'framework/index'),
  ...createConfig('src/framework/react/index.ts', 'framework/react/index'),

  // Legacy paths for backward compatibility
  ...createConfig('src/plugin/sql.ts', 'sql'),
  ...createConfig('src/plugin/store.ts', 'store'),
  ...createConfig('src/plugin/fs.ts', 'fs'),
  ...createConfig('src/framework/react/index.ts', 'react')
];