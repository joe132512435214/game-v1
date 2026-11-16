import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/live',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 2,
  use: {
    baseURL: process.env.LIVE_URL || 'https://game-v1.joebh101.workers.dev/',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
