import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const external = [
  'react',
  'react-dom',
  'react-router-dom'
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
  
  // Individual modules
  ...createConfig('src/app.ts', 'app'),
  ...createConfig('src/microApp.ts', 'microApp'),
];