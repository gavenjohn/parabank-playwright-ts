import { type Page, type Locator, expect } from '@playwright/test';

export class AccountsOverviewPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Accounts Overview' });
  }

  async goto() {
    await this.page.getByRole('link', { name: 'Accounts Overview' }).click();
    await expect(this.heading).toBeVisible();
  }

  async firstAccountNumber(): Promise<string> {
    const cell = this.page.getByRole('row').nth(1).getByRole('cell').first();
    // Assert before reading: a bare textContent() can fire before the cell is
    // populated and silently return "".
    await expect(cell).toHaveText(/\d+/);
    return (await cell.textContent())!.trim();
  }

  async balanceOf(accountNumber: string): Promise<number> {
    // Filters by row rather than position - a customer can hold several
    // accounts, so "first dollar figure on the page" is not a safe locator.
    const row = this.page.getByRole('row').filter({ hasText: accountNumber });
    const text = await row.getByRole('cell').nth(1).textContent(); // column 1 = Balance
    return Number(text?.replace(/[^0-9.-]/g, ''));
  }
}