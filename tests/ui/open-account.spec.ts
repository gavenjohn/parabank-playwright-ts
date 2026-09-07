import { test, expect } from '../../src/fixtures/test-fixtures';

test('opening a new savings account returns a new account number', async ({ authedPage }) => {

  await authedPage.getByRole('link', { name: 'Open New Account' }).click();
  await authedPage.locator('#type').selectOption('1'); // SAVINGS
  await authedPage.getByRole('button', { name: 'Open New Account' }).click();

  await expect(authedPage.getByText('Your new account number:')).toBeVisible();

  // The number is a sibling element with its own id, not part of the label text.
  // getByText matched only the bold label, which is why the regex found no digits.
  const accountLink = authedPage.locator('#newAccountId');
  await expect(accountLink).toBeVisible();

  const newAccountNumber = await accountLink.textContent();
  expect(newAccountNumber).toMatch(/^\d+$/);

});