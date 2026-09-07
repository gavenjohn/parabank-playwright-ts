import { test, expect } from '../../src/fixtures/test-fixtures';

// Guards the fixture itself. If registration breaks, this fails on its own
// rather than every UI test failing at once with a confusing login error.
test('the customer fixture registers and authenticates a new customer', async ({ authedPage, registeredCustomer }) => {
  expect(registeredCustomer.username.length).toBeLessThanOrEqual(20); // see DEF-001
  await expect(authedPage.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
});