import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('Login', () => {
  test('a registered customer can log in and reach the accounts overview', async ({
    page, registeredCustomer, loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(registeredCustomer.username, registeredCustomer.password);
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
  });

  // Uses a real, existing customer with a wrong password. A made-up username
  // would produce the same error for an unrelated reason - the customer
  // wouldn't exist - and the test would pass even if password checking broke.
  test('an invalid password is rejected with an error and no session is created', async ({
    page, registeredCustomer, loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(registeredCustomer.username, 'wrong-password');
    await expect(loginPage.errorMessage()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeHidden();
  });
});