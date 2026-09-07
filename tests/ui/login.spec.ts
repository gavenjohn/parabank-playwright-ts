import { test, expect } from '@playwright/test';

// Pre - Registered manually 
const USER = 'gaven_demo';
const PASS = 'Test1234';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/parabank/index.htm'); // relative - respects baseURL in config
  });

  test('a registered customer can log in and reach the accounts overview', async ({ page }) => {
    await page.locator('input[name="username"]').fill(USER);
    await page.locator('input[name="password"]').fill(PASS);
    await page.locator('input[type="submit"]').click();
    
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
    
});
  test('an invalid password is rejected with an error and no session is created', async ({ page }) => {
    await page.locator('input[name="username"]').fill(USER);
    await page.locator('input[name="password"]').fill('wrong-password');
    await page.locator('input[type="submit"]').click();

    // Asserting the error AND that we did not get in
    await expect(page.getByText('The username and password could not be verified.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeHidden();
  });

});