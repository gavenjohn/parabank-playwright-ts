import { test, expect } from '../../src/fixtures/test-fixtures';

// DEF-005. Both expected to fail: the endpoint takes credentials as URL path
// segments, sets no session, and returns the full customer record, SSN included.

test('login endpoint should not accept credentials in the URL path', async ({
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

// Separate from the status check so it runs while that one fails. Searches the raw
// body rather than parsed JSON, so a removed or non-JSON endpoint counts as fixed.
test('login endpoint should not return the customer SSN', async ({
  request, registeredCustomer,
}) => {
  test.fail();

  const response = await request.get(
    `/parabank/services/bank/login/${registeredCustomer.username}/${registeredCustomer.password}`,
    { headers: { Accept: 'application/json' } },
  );

  expect(await response.text()).not.toContain(registeredCustomer.ssn);
});
