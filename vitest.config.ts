import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Use real Node environment for database + API tests
    environment: 'node',

    // Global setup: create test users, seed data
    globalSetup: ['./test/setup/global-setup.ts'],

    // Per-file setup: load env, configure clients
    setupFiles: ['./test/setup/test-env.ts'],

    // Increase timeout for real network calls to Supabase
    testTimeout: 30_000,
    hookTimeout: 30_000,

    // Run tests serially — they share a real database
    sequence: {
      concurrent: false,
    },

    // Include integration tests only (E2E uses Playwright)
    include: ['test/integration/**/*.test.ts'],

    // Environment variables from .env.test
    env: {
      NODE_ENV: 'test',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
});
