import { test, expect, type Page } from '@playwright/test';

const USER = 'gaven_demo';
const PASS = 'Test1234';

test('opening a new savings account returns a new account number', async ({ page }) => {
  await page.goto('/parabank/index.htm');
  await page.locator('input[name="username"]').fill(USER);
  await page.locator('input[name="password"]').fill(PASS);
  await page.getByRole('button', { name: 'Log In' }).click();

  await page.getByRole('link', { name: 'Open New Account' }).click();
  await page.locator('#type').selectOption('1'); // SAVINGS
  await page.getByRole('button', { name: 'Open New Account' }).click();

  await expect(page.getByText('Your new account number:')).toBeVisible();

  // The number is a sibling element with its own id, not part of the label text.
  // getByText matched only the bold label, which is why the regex found no digits.
  const accountLink = page.locator('#newAccountId');
  await expect(accountLink).toBeVisible();

  const newAccountNumber = await accountLink.textContent();
  expect(newAccountNumber).toMatch(/^\d+$/);

  console.log('New account created:', newAccountNumber);
});