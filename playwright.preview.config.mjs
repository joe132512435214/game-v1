import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/preview',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 45_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
