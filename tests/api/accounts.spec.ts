import { test, expect } from '../../src/fixtures/test-fixtures';
import { accountSchema, transactionsSchema } from '../../src/api/schemas';

test.describe('Accounts API', () => {
  test('GET account by id returns a well-formed account', async ({ request, authedPage, accountsOverviewPage }) => {
    await accountsOverviewPage.goto();
    const accountId = await accountsOverviewPage.firstAccountNumber();

    const response = await request.get(`/parabank/services/bank/accounts/${accountId}`, {
      headers: { Accept: 'application/json' },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    const result = accountSchema.safeParse(body);
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
  });

  // Undocumented: 400 rather than 404, and a plain-text body despite
  // Accept: application/json.
  test('GET a non-existent account returns 400 with a plain-text message', async ({ request }) => {
    const response = await request.get('/parabank/services/bank/accounts/999999', {
      headers: { Accept: 'application/json' },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('text/plain');

    const body = await response.text();
    expect(body).toContain('Could not find account #999999');
  });

  // A new customer's account has no transactions; opening a second account debits it,
  // so there is a transaction to validate.
  test('GET transactions for an account returns a well-formed list', async ({
    request, authedPage, accountsOverviewPage, openAccountPage,
  }) => {
    await accountsOverviewPage.goto();
    const accountId = await accountsOverviewPage.firstAccountNumber();

    await openAccountPage.goto();
    await openAccountPage.openSavings();

    const response = await request.get(
      `/parabank/services/bank/accounts/${accountId}/transactions/month/All/type/All`,
      { headers: { Accept: 'application/json' } },
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    const result = transactionsSchema.safeParse(body);
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});