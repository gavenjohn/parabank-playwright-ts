import { test, expect, type Page } from '@playwright/test';

const USER = 'gaven_demo';
const PASS = 'Test1234';
const FROM = '13566';
const TO = '13677';
const AMOUNT = 100;

async function balanceOf(page: Page, accountNumber: string): Promise<number> {
  const row = page.getByRole('row').filter({ hasText: accountNumber });
  const balanceText = await row.getByRole('cell').nth(1).textContent();
  return Number(balanceText?.replace(/[^0-9.-]/g, ''));
}

test('a transfer moves the exact amount between two accounts', async ({ page }) => {
  await page.goto('/parabank/index.htm');
  await page.locator('input[name="username"]').fill(USER);
  await page.locator('input[name="password"]').fill(PASS);
  await page.getByRole('button', { name: 'Log In' }).click();

  // Read balances first. Asserting against hard-coded figures would break as
  // soon as any other test moves money on this customer.
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  const fromBefore = await balanceOf(page, FROM);
  const toBefore = await balanceOf(page, TO);

  await page.getByRole('link', { name: 'Transfer Funds' }).click();
  await page.locator('#amount').fill(String(AMOUNT));
  await page.locator('#fromAccountId').selectOption(FROM); // never rely on the default
  await page.locator('#toAccountId').selectOption(TO);
  await page.getByRole('button', { name: 'Transfer' }).click();

  await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).toBeVisible();

  // The actual point of this test. "Transfer Complete!" appearing while the
  // money did not move is precisely the defect a bank cares about, and a
  // success-message assertion alone would pass straight through it.
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  expect(await balanceOf(page, FROM)).toBe(fromBefore - AMOUNT);
  expect(await balanceOf(page, TO)).toBe(toBefore + AMOUNT);
});