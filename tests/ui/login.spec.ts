import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('Login', () => {
  test('a registered customer can log in and reach the accounts overview', async ({
    page, registeredCustomer, loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(registeredCustomer.username, registeredCustomer.password);
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
  });

  // A real customer with a wrong password: an unknown username returns the same
  // error, and would pass even if password checking were broken.
  test('an invalid password is rejected and does not reach the accounts overview', async ({
    page, registeredCustomer, loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(registeredCustomer.username, 'wrong-password');
    await expect(loginPage.errorMessage()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeHidden();
  });
});