import { test, expect } from '../../src/fixtures/test-fixtures';

// DEF-005. Expected to fail: credentials are accepted as URL path segments,
// no session is set, and the full customer record is returned, SSN included.
test('login endpoint should not accept credentials via URL or return PII', async ({
  request, registeredCustomer,
}) => {
  test.fail();

  const response = await request.get(
    `/parabank/services/bank/login/${registeredCustomer.username}/${registeredCustomer.password}`,
    { headers: { Accept: 'application/json' } },
  );

  // Any non-error status means credentials in the URL are still accepted.
  expect(response.status()).toBeGreaterThanOrEqual(400);
});