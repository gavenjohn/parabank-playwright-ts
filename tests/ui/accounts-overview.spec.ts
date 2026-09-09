import { test, expect } from '../../src/fixtures/test-fixtures';

// A page rendering "$NaN" or "$undefined" still passes a plain visibility
// check. Parsing the text to a real number is what actually catches that.
test('accounts overview shows a numeric balance', async ({ authedPage, accountsOverviewPage }) => {
  await accountsOverviewPage.goto();
  const accountNumber = await accountsOverviewPage.firstAccountNumber();
  const balance = await accountsOverviewPage.balanceOf(accountNumber);

  expect(balance).not.toBeNaN();
  expect(balance).toBeGreaterThanOrEqual(0);
});