import { type Page, type Locator, expect } from '@playwright/test';

export class OpenAccountPage {
  readonly page: Page;
  readonly typeSelect: Locator;
  readonly openButton: Locator;
  readonly newAccountId: Locator;

  constructor(page: Page) {
    this.page = page;
    this.typeSelect = page.locator('#type');
    this.openButton = page.getByRole('button', { name: 'Open New Account' });
    this.newAccountId = page.locator('#newAccountId');
  }

  async goto() {
    await this.page.getByRole('link', { name: 'Open New Account' }).click();
  }

  async openSavings(): Promise<string> {
    await this.typeSelect.selectOption('1'); // SAVINGS, per codegen capture
    await this.openButton.click();
    // The confirmation text and the account number are separate elements
    // (#newAccountId is its own node) - reading the label alone yields no digits.
    await expect(this.newAccountId).toBeVisible();
    return (await this.newAccountId.textContent())!.trim();
  }
}