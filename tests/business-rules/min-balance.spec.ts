import { test, expect } from '../../src/fixtures/test-fixtures';
import { AdminPage } from '../../src/pages/admin.page';

// DEF-002: a transfer exceeding the available balance currently succeeds and
// drives the account below the configured minimum, instead of being
// rejected. This test encodes the correct behaviour and is marked as an
// expected failure so CI stays green while the defect is open. If ParaBank
// starts enforcing the minimum, this flips to an unexpected pass - remove
// test.fail() at that point rather than treating it as newly broken.
test('a transfer exceeding the configured minimum balance is rejected', async ({
  authedPage, accountsOverviewPage, openAccountPage, transferPage,
}) => {
  test.fail();

  const admin = new AdminPage(authedPage);
  await admin.goto();
  const originalMinimum = await admin.currentMinimumBalance();
  await admin.setMinimumBalance('100');

  try {
    await accountsOverviewPage.goto();
    const from = await accountsOverviewPage.firstAccountNumber();
    const fromBefore = await accountsOverviewPage.balanceOf(from);

    await openAccountPage.goto();
    const to = await openAccountPage.openSavings();

    // Exceeds both the funded account's balance and the configured minimum.
    await transferPage.goto();
    await transferPage.transfer(fromBefore + 50, from, to);

    await accountsOverviewPage.goto();
    expect(await accountsOverviewPage.balanceOf(from)).toBeGreaterThanOrEqual(100);
  } finally {
    await admin.goto();
    await admin.setMinimumBalance(originalMinimum);
  }
});