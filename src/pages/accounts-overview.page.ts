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
    // Assert first: textContent() alone can read the cell before it's populated.
    await expect(cell).toHaveText(/\d+/);
    return (await cell.textContent())!.trim();
  }

  async balanceOf(accountNumber: string): Promise<number> {
    // Matched by account number, not position - a customer can hold several accounts.
    const row = this.page.getByRole('row').filter({ hasText: accountNumber });
    const text = await row.getByRole('cell').nth(1).textContent(); // column 1 = Balance
    return Number(text?.replace(/[^0-9.-]/g, ''));
  }
}