import { type Page, type Locator } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly minimumBalance: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.minimumBalance = page.locator('#minimumBalance');
    // Scoped to #adminForm - the page also has separate Initialize/Clean and
    // JMS Shutdown buttons that a broader role query would also match.
    this.submit = page.locator('#adminForm').getByRole('button', { name: 'Submit' });
  }

  async goto() {
    await this.page.goto('/parabank/admin.htm');
  }

  async currentMinimumBalance(): Promise<string> {
    return this.minimumBalance.inputValue();
  }

  async setMinimumBalance(value: string) {
    await this.minimumBalance.fill(value);
    await this.submit.click();
  }
}