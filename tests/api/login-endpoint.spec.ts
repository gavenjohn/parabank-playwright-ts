import { test, expect } from '../../src/fixtures/test-fixtures';

// DEF-005: this endpoint accepts credentials via URL path segments rather
// than a request body, issues no session (no Set-Cookie), and returns the
// full customer record - including SSN - in plaintext JSON. Credentials in
// a URL are written to access logs, proxy logs, and browser history by
// design; this asserts the behaviour that should hold instead.
test('login endpoint should not accept credentials via URL or return PII', async ({
  request, registeredCustomer,
}) => {
  test.fail();

  const response = await request.get(
    `/parabank/services/bank/login/${registeredCustomer.username}/${registeredCustomer.password}`,
    { headers: { Accept: 'application/json' } },
  );

  // A credential-bearing GET should not succeed at all - the correct design
  // is a POST with credentials in the body. Anything other than a client or
  // server error here means the vulnerable pattern is live.
  expect(response.status()).toBeGreaterThanOrEqual(400);
});