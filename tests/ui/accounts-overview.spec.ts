import { test, expect } from '../../src/fixtures/test-fixtures';

test('accounts overview shows a numeric balance', async ({ authedPage }) => {

  const balanceCell = authedPage.getByRole('cell', { name: '$' }).first();
  await expect(balanceCell).toBeVisible();

  // The point of this test: a authedPage rendering "$NaN" or "$undefined" still
  // passes a plain visibility check. Parsing the text to a real number is
  // what actually catches that.
  const raw = await balanceCell.textContent();
  const balance = Number(raw?.replace(/[^0-9.-]/g, ''));

  expect(balance).not.toBeNaN();
  expect(balance).toBeGreaterThanOrEqual(0);
});