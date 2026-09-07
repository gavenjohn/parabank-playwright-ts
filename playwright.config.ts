import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,     // a stray test.only must not silently shrink the CI run
  retries: process.env.CI ? 1 : 0,  // one retry in CI surfaces flake in the report without
                                    // hiding it; zero locally so flake is visible while writing
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  use: {
    headless: false,
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    trace: 'on-first-retry',        // full trace for anything that failed once
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});