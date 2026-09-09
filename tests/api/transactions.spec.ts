import { test, expect, type APIRequestContext } from '../../src/fixtures/test-fixtures';
import { transactionSchema, transactionsSchema } from '../../src/api/schemas';

const AMOUNT = 25;

function todayAsMMDDYYYY(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}-${dd}-${now.getFullYear()}`;
}

// A fresh customer has no transaction history. Creates one real Debit
// transaction via the API - not the UI - consistent with how customer data
// is provisioned elsewhere in this suite.
async function createTransaction(
  request: APIRequestContext,
  accountsOverviewPage: any,
  openAccountPage: any,
): Promise<string> {
  await accountsOverviewPage.goto();
  const fromAccountId = await accountsOverviewPage.firstAccountNumber();

  await openAccountPage.goto();
  const toAccountId = await openAccountPage.openSavings();

  await request.post('/parabank/services/bank/transfer', {
    params: { fromAccountId, toAccountId, amount: String(AMOUNT) },
    headers: { Accept: 'application/json' },
  });

  return fromAccountId;
}

test.describe('Transactions API', () => {
  test('GET transaction by id returns a well-formed transaction', async ({
    request, authedPage, accountsOverviewPage, openAccountPage,
  }) => {
    const accountId = await createTransaction(request, accountsOverviewPage, openAccountPage);

    // amount/{amount} is already covered by its own test below - reused
    // here only to discover a real transaction id to verify against.
    const byAmount = await request.get(
      `/parabank/services/bank/accounts/${accountId}/transactions/amount/${AMOUNT}`,
      { headers: { Accept: 'application/json' } },
    );
    const [{ id }] = await byAmount.json();

    const response = await request.get(`/parabank/services/bank/transactions/${id}`, {
      headers: { Accept: 'application/json' },
    });

    expect(response.status()).toBe(200);
    const result = transactionSchema.safeParse(await response.json());
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
  });

  test('GET transaction by a non-existent id returns an error', async ({ request }) => {
    const response = await request.get('/parabank/services/bank/transactions/999999', {
      headers: { Accept: 'application/json' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET transactions by amount returns matching transactions', async ({
    request, authedPage, accountsOverviewPage, openAccountPage,
  }) => {
    const accountId = await createTransaction(request, accountsOverviewPage, openAccountPage);

    const response = await request.get(
      `/parabank/services/bank/accounts/${accountId}/transactions/amount/${AMOUNT}`,
      { headers: { Accept: 'application/json' } },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    const result = transactionsSchema.safeParse(body);
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    expect(body.every((t: { amount: number }) => t.amount === AMOUNT)).toBe(true);
  });

  test('GET transactions on a specific date returns matching transactions', async ({
    request, authedPage, accountsOverviewPage, openAccountPage,
  }) => {
    const accountId = await createTransaction(request, accountsOverviewPage, openAccountPage);

    // Confirmed via manual testing: this endpoint expects MM-DD-YYYY, not
    // the ISO format ParaBank uses in its own JSON responses.
    const response = await request.get(
      `/parabank/services/bank/accounts/${accountId}/transactions/onDate/${todayAsMMDDYYYY()}`,
      { headers: { Accept: 'application/json' } },
    );

    expect(response.status()).toBe(200);
    const result = transactionsSchema.safeParse(await response.json());
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
  });
});