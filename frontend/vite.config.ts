/// <reference types="vitest" />
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5183,
    strictPort: true,
    // During local dev, proxy /api to the backend so there is no CORS friction and
    // the httpOnly refresh cookie flows on the same origin. There is no Docker to
    // orchestrate both processes - run backend (port 3000) and frontend separately.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    // ./tests/** is the admin portal's Playwright suite (playwright.admin.config.js),
    // not Vitest specs - Vitest's default *.spec.* glob would otherwise pick up
    // tests/*.spec.js and fail on Playwright's test.describe() (same reason
    // ./e2e/** is excluded for the student portal's Playwright specs above).
    exclude: ['**/node_modules/**', './e2e/**', './tests/**'],
  },
});
