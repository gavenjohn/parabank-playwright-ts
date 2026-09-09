import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.locator('input[name="username"]');
    this.password = page.locator('input[name="password"]');
    // input[type="submit"], not getByRole('button', { name: 'Log In' }) - ParaBank
    // renders this as a styled <input>, which has no accessible name to match on.
    this.submit = page.locator('input[type="submit"]');
  }

  async goto() {
    await this.page.goto('/parabank/index.htm');
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }

  errorMessage(): Locator {
    return this.page.getByText('The username and password could not be verified.');
  }
}