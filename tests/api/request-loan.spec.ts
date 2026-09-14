import { test, expect } from '../../src/fixtures/test-fixtures';
import { loanResponseSchema } from '../../src/api/schemas';

// Confirmed via manual testing against the default Loan Processor
// (Available Funds, unchanged from admin defaults - no admin config driven
// by this file). Two independent checks: the down payment alone must not
// exceed the funding account's balance ("insufficient.funds.for.down.payment"
// if it does, checked first), and the remaining amount must not exceed the
// balance either ("insufficient.funds" if it does). Unlike DEF-002, this
// rule is correctly enforced - these are ordinary tests, not test.fail().
test.describe('Request Loan API', () => {
  async function customerIdFor(request: any, fromAccountId: string): Promise<number> {
    const res = await request.get(`/parabank/services/bank/accounts/${fromAccountId}`, {
      headers: { Accept: 'application/json' },
    });
    return (await res.json()).customerId;
  }

  test('a loan within the funding account balance is approved', async ({
    request, authedPage, accountsOverviewPage,
  }) => {
    await accountsOverviewPage.goto();
    const fromAccountId = await accountsOverviewPage.firstAccountNumber();
    const customerId = await customerIdFor(request, fromAccountId);

    const response = await request.post('/parabank/services/bank/requestLoan', {
      params: { customerId: String(customerId), amount: '100', downPayment: '0', fromAccountId },
      headers: { Accept: 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const result = loanResponseSchema.safeParse(body);
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    expect(body.approved).toBe(true);
    expect(body.accountId).not.toBeNull();
  });

  test('a loan amount exceeding the funding account balance is denied', async ({
    request, authedPage, accountsOverviewPage,
  }) => {
    await accountsOverviewPage.goto();
    const fromAccountId = await accountsOverviewPage.firstAccountNumber();
    const customerId = await customerIdFor(request, fromAccountId);

    const response = await request.post('/parabank/services/bank/requestLoan', {
      params: { customerId: String(customerId), amount: '5000', downPayment: '0', fromAccountId },
      headers: { Accept: 'application/json' },
    });

    const body = await response.json();
    expect(body.approved).toBe(false);
    expect(body.message).toBe('error.insufficient.funds');
    expect(body.accountId).toBeNull();
  });

  test('a down payment exceeding the funding account balance is denied', async ({
    request, authedPage, accountsOverviewPage,
  }) => {
    await accountsOverviewPage.goto();
    const fromAccountId = await accountsOverviewPage.firstAccountNumber();
    const customerId = await customerIdFor(request, fromAccountId);

    const response = await request.post('/parabank/services/bank/requestLoan', {
      params: { customerId: String(customerId), amount: '5000', downPayment: '1200', fromAccountId },
      headers: { Accept: 'application/json' },
    });

    const body = await response.json();
    expect(body.approved).toBe(false);
    expect(body.message).toBe('error.insufficient.funds.for.down.payment');
    expect(body.accountId).toBeNull();
  });
});