import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e-savings',
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'playwright-results.json' }]],
  use: { baseURL: 'http://localhost:8081' },
});