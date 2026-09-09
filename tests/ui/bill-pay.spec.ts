import { test, expect } from '../../src/fixtures/test-fixtures';

const AMOUNT = 50;

test('paying a bill debits the exact amount from the source account', async ({
  authedPage, accountsOverviewPage, billPayPage,
}) => {
  await accountsOverviewPage.goto();
  const from = await accountsOverviewPage.firstAccountNumber();
  const before = await accountsOverviewPage.balanceOf(from);

  await billPayPage.goto();
  await billPayPage.pay(
    {
      name: 'Jane Doe',
      street: '321 Avenue',
      city: 'Toronto',
      state: 'Ontario',
      zipCode: 'M3J1R1',
      phoneNumber: '1234566543',
      accountNumber: '13790',
    },
    AMOUNT,
    from,
  );

  await accountsOverviewPage.goto();
  expect(await accountsOverviewPage.balanceOf(from)).toBe(before - AMOUNT);
});