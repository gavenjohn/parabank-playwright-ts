import { test, expect } from '../../src/fixtures/test-fixtures';

// Guards the fixture itself, independent of any feature test built on it.
test('the customer fixture registers and authenticates a new customer', async ({ authedPage, registeredCustomer }) => {
  expect(registeredCustomer.username.length).toBeLessThanOrEqual(20); // see DEF-001
  await expect(authedPage.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
});