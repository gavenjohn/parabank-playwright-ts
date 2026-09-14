import { type APIRequestContext } from '@playwright/test';
import { test, expect } from '../../src/fixtures/test-fixtures';
import { transactionSchema, transactionsSchema } from '../../src/api/schemas';
import { type AccountsOverviewPage } from '../../src/pages/accounts-overview.page';
import { type OpenAccountPage } from '../../src/pages/open-account.page';

const AMOUNT = 25;

// UTC, not local time: the container's clock is UTC and dates transactions by it,
// so a runner behind UTC would ask for the previous day every evening.
function todayAsMMDDYYYY(): string {
  const now = new Date();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${mm}-${dd}-${now.getUTCFullYear()}`;
}

// Creates a transaction of a known amount to look up: opens a savings account
// through the UI, then transfers AMOUNT into it over the API.
async function createTransaction(
  request: APIRequestContext,
  accountsOverviewPage: AccountsOverviewPage,
  openAccountPage: OpenAccountPage,
): Promise<string> {
  await accountsOverviewPage.goto();
  const fromAccountId = await accountsOverviewPage.firstAccountNumber();

  await openAccountPage.goto();
  const toAccountId = await openAccountPage.openSavings();

  const transfer = await request.post('/parabank/services/bank/transfer', {
    params: { fromAccountId, toAccountId, amount: String(AMOUNT) },
    headers: { Accept: 'application/json' },
  });
  expect(transfer.status(), 'setup transfer failed').toBe(200);

  return fromAccountId;
}

test.describe('Transactions API', () => {
  test('GET transaction by id returns a well-formed transaction', async ({
    request, authedPage, accountsOverviewPage, openAccountPage,
  }) => {
    const accountId = await createTransaction(request, accountsOverviewPage, openAccountPage);

    // Looked up by amount only to find a real id; that endpoint has its own test.
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
    expect(body.length).toBeGreaterThan(0); // every() and the schema both pass on []
    expect(body.every((t: { amount: number }) => t.amount === AMOUNT)).toBe(true);
  });

  test('GET transactions on a specific date returns matching transactions', async ({
    request, authedPage, accountsOverviewPage, openAccountPage,
  }) => {
    const accountId = await createTransaction(request, accountsOverviewPage, openAccountPage);

    // Undocumented: expects MM-DD-YYYY, although responses carry epoch millis.
    const response = await request.get(
      `/parabank/services/bank/accounts/${accountId}/transactions/onDate/${todayAsMMDDYYYY()}`,
      { headers: { Accept: 'application/json' } },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    const result = transactionsSchema.safeParse(body);
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('GET transactions within a date range returns matching transactions', async ({
    request, authedPage, accountsOverviewPage, openAccountPage,
  }) => {
    const accountId = await createTransaction(request, accountsOverviewPage, openAccountPage);
    const today = todayAsMMDDYYYY();

    // Both bounds are inclusive, so a same-day range covers today's transaction.
    const response = await request.get(
      `/parabank/services/bank/accounts/${accountId}/transactions/fromDate/${today}/toDate/${today}`,
      { headers: { Accept: 'application/json' } },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    const result = transactionsSchema.safeParse(body);
    expect(result.success, JSON.stringify(result.success ? null : result.error.issues)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});