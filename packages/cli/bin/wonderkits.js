#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 导入主入口点
import(resolve(__dirname, '../dist/index.js')).catch((error) => {
  console.error('Failed to start MagicTeam CLI:', error);
  process.exit(1);
});