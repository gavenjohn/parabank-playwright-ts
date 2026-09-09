import { type Page, type Locator, expect } from '@playwright/test';

export interface Payee {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  accountNumber: string;
}

export class BillPayPage {
  readonly page: Page;
  readonly payeeName: Locator;
  readonly payeeStreet: Locator;
  readonly payeeCity: Locator;
  readonly payeeState: Locator;
  readonly payeeZipCode: Locator;
  readonly payeePhoneNumber: Locator;
  readonly payeeAccountNumber: Locator;
  readonly verifyAccount: Locator;
  readonly amount: Locator;
  readonly fromAccount: Locator;
  readonly submit: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.payeeName = page.locator('input[name="payee.name"]');
    this.payeeStreet = page.locator('input[name="payee.address.street"]');
    this.payeeCity = page.locator('input[name="payee.address.city"]');
    this.payeeState = page.locator('input[name="payee.address.state"]');
    this.payeeZipCode = page.locator('input[name="payee.address.zipCode"]');
    this.payeePhoneNumber = page.locator('input[name="payee.phoneNumber"]');
    this.payeeAccountNumber = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccount = page.locator('input[name="verifyAccount"]');
    this.amount = page.locator('input[name="amount"]');
    this.fromAccount = page.locator('select[name="fromAccountId"]');
    this.submit = page.getByRole('button', { name: 'Send Payment' });
    this.confirmation = page.getByRole('heading', { name: 'Bill Payment Complete' });
  }

  async goto() {
    await this.page.getByRole('link', { name: 'Bill Pay' }).click();
  }

  async pay(payee: Payee, amount: number, fromAccountId: string) {
    await this.payeeName.fill(payee.name);
    await this.payeeStreet.fill(payee.street);
    await this.payeeCity.fill(payee.city);
    await this.payeeState.fill(payee.state);
    await this.payeeZipCode.fill(payee.zipCode);
    await this.payeePhoneNumber.fill(payee.phoneNumber);
    await this.payeeAccountNumber.fill(payee.accountNumber);
    await this.verifyAccount.fill(payee.accountNumber);
    await this.amount.fill(String(amount));
    await this.fromAccount.selectOption(fromAccountId);
    await this.submit.click();
    await expect(this.confirmation).toBeVisible();
  }
}