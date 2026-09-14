import { test, expect } from '../../src/fixtures/test-fixtures';

// DEF-002. Expected to fail: the transfer is authorised and leaves the account
// below the configured minimum instead of being rejected.
test('a transfer exceeding the configured minimum balance is rejected', async ({
  authedPage, adminPage, accountsOverviewPage, openAccountPage, transferPage,
}) => {
  test.fail();

  await adminPage.goto();
  const originalMinimum = await adminPage.currentMinimumBalance();
  await adminPage.setMinimumBalance('100');

  try {
    await accountsOverviewPage.goto();
    const from = await accountsOverviewPage.firstAccountNumber();
    const fromBefore = await accountsOverviewPage.balanceOf(from);

    await openAccountPage.goto();
    const to = await openAccountPage.openSavings();

    // Exceeds both the funded account's balance and the configured minimum.
    // submitTransfer, not transfer: a rejected transfer must reach the balance
    // check, so a fix shows up as an unexpected pass.
    await transferPage.goto();
    await transferPage.submitTransfer(fromBefore + 50, from, to);

    await accountsOverviewPage.goto();
    expect(await accountsOverviewPage.balanceOf(from)).toBeGreaterThanOrEqual(100);
  } finally {
    await adminPage.goto();
    await adminPage.setMinimumBalance(originalMinimum);
  }
});