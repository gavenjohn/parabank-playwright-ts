import { test, expect } from '../../src/fixtures/test-fixtures';

const AMOUNT = 100;

test('a transfer moves the exact amount between two accounts', async ({
  authedPage, accountsOverviewPage, openAccountPage, transferPage,
}) => {
  await accountsOverviewPage.goto();
  const from = await accountsOverviewPage.firstAccountNumber();

  // A new customer starts with one account, so a second is opened here as the
  // transfer destination.
  await openAccountPage.goto();
  const to = await openAccountPage.openSavings();

  await accountsOverviewPage.goto();
  const fromBefore = await accountsOverviewPage.balanceOf(from);
  const toBefore = await accountsOverviewPage.balanceOf(to);

  await transferPage.goto();
  await transferPage.transfer(AMOUNT, from, to);

  // The actual point of the test: "Transfer Complete!" appearing while the
  // money did not move is exactly the defect a bank cares about, and the
  // confirmation heading alone would pass straight through it.
  await accountsOverviewPage.goto();
  expect(await accountsOverviewPage.balanceOf(from)).toBe(fromBefore - AMOUNT);
  expect(await accountsOverviewPage.balanceOf(to)).toBe(toBefore + AMOUNT);
});