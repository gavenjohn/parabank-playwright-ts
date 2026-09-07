import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 1,  // ParaBank serves one customer's account list to every test, and all
               // tests currently log in as the same hard-coded user. Running in
               // parallel makes the Open New Account form submit against a stale
               // account list. Serialising is a stopgap; the real fix is a fresh
               // customer per test (day 3 fixture).
  forbidOnly: !!process.env.CI,     // a stray test.only must not silently shrink the CI run
  retries: process.env.CI ? 1 : 0,  // one retry in CI surfaces flake in the report without
                                    // hiding it; zero locally so flake is visible while writing
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  use: {
    
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    trace: 'on-first-retry',        // full trace for anything that failed once
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});