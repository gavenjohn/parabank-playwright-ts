import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Creates the ParaBank database schema, which the image does not ship with.
  // Runs for local and CI runs alike, so the two cannot drift apart.
  globalSetup: './src/setup/global-setup.ts',
  fullyParallel: true,
  workers: 1,  // ParaBank allocates ids with an unlocked read-then-update, so concurrent
               // creates collide or deadlock (DEF-003). Reproduced at 2 and 4 workers;
               // the defect is server-side, so serialising is the only fix from here.
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
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});