import { type Page, type Locator, expect } from '@playwright/test';

export class TransferPage {
  readonly page: Page;
  readonly amount: Locator;
  readonly fromAccount: Locator;
  readonly toAccount: Locator;
  readonly submit: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.amount = page.locator('#amount');
    this.fromAccount = page.locator('#fromAccountId');
    this.toAccount = page.locator('#toAccountId');
    this.submit = page.getByRole('button', { name: 'Transfer' });
    this.confirmation = page.getByRole('heading', { name: 'Transfer Complete!' });
  }

  async goto() {
    await this.page.getByRole('link', { name: 'Transfer Funds' }).click();
  }

  async transfer(amount: number, from: string, to: string) {
    await this.amount.fill(String(amount));
    // Never rely on the dropdown's default selection - if ParaBank changes
    // it, the test would silently transfer from the wrong account.
    await this.fromAccount.selectOption(from);
    await this.toAccount.selectOption(to);
    await this.submit.click();
    await expect(this.confirmation).toBeVisible();
  }
}