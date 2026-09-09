import { test, expect } from '../../src/fixtures/test-fixtures';
import { accountSchema, transactionsSchema } from '../../src/api/schemas';

test.describe('Accounts API', () => {
  test('GET account by id returns a well-formed account', async ({ request, registeredCustomer, authedPage, accountsOverviewPage }) => {
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

  // ParaBank returns 400, not 404, for a non-existent account, and the error
  // body ignores the Accept header and comes back as plain text rather than
  // JSON - success and failure responses are negotiated differently.
  test('GET a non-existent account returns 400 with a plain-text message', async ({ request }) => {
    const response = await request.get('/parabank/services/bank/accounts/999999', {
      headers: { Accept: 'application/json' },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('text/plain');

    const body = await response.text();
    expect(body).toContain('Could not find account #999999');
  });

  test('GET transactions for an account returns a well-formed list', async ({ request, authedPage, accountsOverviewPage }) => {
    await accountsOverviewPage.goto();
    const accountId = await accountsOverviewPage.firstAccountNumber();

    const response = await request.get(
      `/parabank/services/bank/accounts/${accountId}/transactions/month/All/type/All`,
      { headers: { Accept: 'application/json' } },
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    const result = transactionsSchema.safeParse(body);
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
  });
});