import { test, expect } from '../../src/fixtures/test-fixtures';

// A fresh account number is minted on every run, so the assertion checks
// shape, not a specific value - a hard-coded number would fail on the second run.
test('opening a new savings account returns a new account number', async ({
  authedPage, openAccountPage,
}) => {
  await openAccountPage.goto();
  const newAccountNumber = await openAccountPage.openSavings();
  expect(newAccountNumber).toMatch(/^\d+$/);
});