import { test, expect } from '../../src/fixtures/test-fixtures';

// Account numbers are allocated per run, so this checks the format, not a value.
test('opening a new savings account returns a new account number', async ({
  authedPage, openAccountPage,
}) => {
  await openAccountPage.goto();
  const newAccountNumber = await openAccountPage.openSavings();
  expect(newAccountNumber).toMatch(/^\d+$/);
});