/**
 * Jest 测试配置
 * 支持 TypeScript 和 ES Modules
 */

export default {
  // 测试环境
  testEnvironment: 'node',

  // TypeScript 支持
  preset: 'ts-jest',

  // 模块解析
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // 测试文件匹配模式
  testMatch: [
    '**/src/**/*.test.ts',
    '**/tests/**/*.test.ts',
    '**/__tests__/**/*.test.ts',
    '**/src/**/*.spec.ts',
    '**/tests/**/*.spec.ts',
    '**/__tests__/**/*.spec.ts'
  ],

  // 忽略的测试文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // 转换配置
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },

  // 模块名映射 (用于路径别名)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // 收集覆盖率的文件
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts'
  ],

  // 覆盖率报告
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // 测试设置文件 (先注释，文件不存在)
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 超时设置
  testTimeout: 30000,

  // 详细输出
  verbose: true,

  // 清除 mock 在每个测试之间
  clearMocks: true,

  // 全局变量
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },

  // 测试结果处理器
  testResultsProcessor: undefined,

  // 监视模式配置
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ]
};