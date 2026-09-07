import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('Login', () => {
  test('a registered customer can log in and reach the accounts overview', async ({ page, registeredCustomer }) => {
    await page.goto('/parabank/index.htm');
    await page.locator('input[name="username"]').fill(registeredCustomer.username);
    await page.locator('input[name="password"]').fill(registeredCustomer.password);
    await page.locator('input[type="submit"]').click();

    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
  });
      test('an invalid password is rejected with an error and no session is created', async ({ page, registeredCustomer }) => {
    await page.goto('/parabank/index.htm');
    // A real, existing customer with a wrong password. Using a made-up username
    // would produce the same error message for a completely different reason,
    // and the test would pass even if password checking were broken entirely.
    await page.locator('input[name="username"]').fill(registeredCustomer.username);
    await page.locator('input[name="password"]').fill('wrong-password');
    await page.locator('input[type="submit"]').click();

    await expect(page.getByText('The username and password could not be verified.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeHidden();
  });
});
