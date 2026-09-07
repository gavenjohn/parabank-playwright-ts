import { test, expect } from '../../src/fixtures/test-fixtures';
import { type Page } from '@playwright/test';

const AMOUNT = 100;

async function balanceOf(page: Page, accountNumber: string): Promise<number> {
  const row = page.getByRole('row').filter({ hasText: accountNumber });
  const balanceText = await row.getByRole('cell').nth(1).textContent();
  return Number(balanceText?.replace(/[^0-9.-]/g, ''));
}

test('a transfer moves the exact amount between two accounts', async ({ authedPage: page }) => {
  // A new customer has exactly one account, so there is nothing to transfer to.
  // Reading the account numbers rather than hard-coding them is what makes this
  // test survive a fresh database - the old version assumed 13566 and 13677.
  const fromCell = page.getByRole('row').nth(1).getByRole('cell').first();
  await expect(fromCell).toHaveText(/\d+/);
  const from = await fromCell.textContent();
  expect(from).toBeTruthy();

  await page.getByRole('link', { name: 'Open New Account' }).click();
  await page.locator('#type').selectOption('1');
  await page.getByRole('button', { name: 'Open New Account' }).click();

  // Wait for the element to actually have text. A bare textContent() can fire
  // before the value is populated and silently return "".
  const newAccount = page.locator('#newAccountId');
  await expect(newAccount).toHaveText(/\d+/);
  const to = await newAccount.textContent();
  expect(to).toBeTruthy();

  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  const fromBefore = await balanceOf(page, from!);
  const toBefore = await balanceOf(page, to!);

  await page.getByRole('link', { name: 'Transfer Funds' }).click();
  await page.locator('#amount').fill(String(AMOUNT));
  await page.locator('#fromAccountId').selectOption(from!);
  await page.locator('#toAccountId').selectOption(to!);
  await page.getByRole('button', { name: 'Transfer' }).click();

  await expect(page.getByRole('heading', { name: 'Transfer Complete!' })).toBeVisible();

  // "Transfer Complete!" appearing while the money did not move is precisely the
  // defect a bank cares about, and a success-message assertion alone passes right
  // through it.
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  expect(await balanceOf(page, from!)).toBe(fromBefore - AMOUNT);
  expect(await balanceOf(page, to!)).toBe(toBefore + AMOUNT);
});