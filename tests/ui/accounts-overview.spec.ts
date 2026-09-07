import { test, expect } from '@playwright/test';

// Duplicated login steps from login.spec.ts - this is exactly the duplication
// Page Object Model removes. Leaving it inline for now; refactoring both files
// to share a login helper
const USER = 'gaven_demo';
const PASS = 'Test1234';

test('accounts overview shows a numeric balance', async ({ page }) => {
  await page.goto('/parabank/index.htm');
  await page.locator('input[name="username"]').fill(USER);
  await page.locator('input[name="password"]').fill(PASS);
  await page.getByRole('button', { name: 'Log In' }).click();

  const balanceCell = page.getByRole('cell', { name: '$' }).first();
  await expect(balanceCell).toBeVisible();

  // The point of this test: a page rendering "$NaN" or "$undefined" still
  // passes a plain visibility check. Parsing the text to a real number is
  // what actually catches that.
  const raw = await balanceCell.textContent();
  const balance = Number(raw?.replace(/[^0-9.-]/g, ''));

  expect(balance).not.toBeNaN();
  expect(balance).toBeGreaterThanOrEqual(0);
});