import { test, expect } from '../../src/fixtures/test-fixtures';

const AMOUNT = 100;

test('a transfer moves the exact amount between two accounts', async ({
  authedPage, accountsOverviewPage, openAccountPage, transferPage,
}) => {
  await accountsOverviewPage.goto();
  const from = await accountsOverviewPage.firstAccountNumber();

  // A new customer has one account, so a second is opened as the destination.
  await openAccountPage.goto();
  const to = await openAccountPage.openSavings();

  await accountsOverviewPage.goto();
  const fromBefore = await accountsOverviewPage.balanceOf(from);
  const toBefore = await accountsOverviewPage.balanceOf(to);

  await transferPage.goto();
  await transferPage.transfer(AMOUNT, from, to);

  // Asserts balances: the confirmation heading alone would pass even if no money moved.
  await accountsOverviewPage.goto();
  expect(await accountsOverviewPage.balanceOf(from)).toBe(fromBefore - AMOUNT);
  expect(await accountsOverviewPage.balanceOf(to)).toBe(toBefore + AMOUNT);
});