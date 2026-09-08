import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Creates the ParaBank database schema, which the image does not ship with.
  // Runs for local and CI runs alike, so the two cannot drift apart.
  globalSetup: './src/setup/global-setup.ts',
  fullyParallel: true,
  workers: 1,  // Not a stopgap any more: ParaBank rejects concurrent registrations as
               // "This username already exists" for usernames that are provably free,
               // and every test registers a customer first. Measured at roughly one
               // failure in six at six workers, landing on whichever test raced. See
               // docs/defects/DEF-003. Serialising is the only fix available from the
               // test side, since the defect is server-side.
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