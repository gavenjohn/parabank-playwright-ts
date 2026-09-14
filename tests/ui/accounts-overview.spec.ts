import { test, expect } from '../../src/fixtures/test-fixtures';

// Parses the balance rather than checking visibility, which "$NaN" would pass.
test('accounts overview shows a numeric balance', async ({ authedPage, accountsOverviewPage }) => {
  await accountsOverviewPage.goto();
  const accountNumber = await accountsOverviewPage.firstAccountNumber();
  const balance = await accountsOverviewPage.balanceOf(accountNumber);

  expect(balance).not.toBeNaN();
  expect(balance).toBeGreaterThanOrEqual(0);
});