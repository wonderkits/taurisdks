import '@testing-library/jest-dom';

// Mock Tauri APIs for testing
global.__TAURI__ = {
  path: {},
  fs: {},
  store: {},
  dialog: {},
  http: {},
  os: {},
};