import { test as base, expect, type Page } from '@playwright/test';
import { newCustomer, type Customer } from '../data/customer-factory';
import { LoginPage } from '../pages/login.page';
import { AccountsOverviewPage } from '../pages/accounts-overview.page';
import { OpenAccountPage } from '../pages/open-account.page';
import { TransferPage } from '../pages/transfer.page';
import { BillPayPage } from '../pages/bill-pay.page';

type Fixtures = {
  registeredCustomer: Customer;
  authedPage: Page;
  loginPage: LoginPage;
  accountsOverviewPage: AccountsOverviewPage;
  openAccountPage: OpenAccountPage;
  transferPage: TransferPage;
  billPayPage: BillPayPage;
};

export const test = base.extend<Fixtures>({
  // Posts the registration form directly - ParaBank has no JSON registration
  // endpoint. Faster than driving the page, and doesn't couple every test to it.
  registeredCustomer: async ({ request }, use) => {
    const customer = newCustomer();

    // Required: the POST binds to a form object this GET creates, and 500s without it.
    await request.get('/parabank/register.htm');

    const response = await request.post('/parabank/register.htm', {
      form: {
        'customer.firstName': customer.firstName,
        'customer.lastName': customer.lastName,
        'customer.address.street': customer.street,
        'customer.address.city': customer.city,
        'customer.address.state': customer.state,
        'customer.address.zipCode': customer.zipCode,
        'customer.phoneNumber': customer.phoneNumber,
        'customer.ssn': customer.ssn,
        'customer.username': customer.username,
        'customer.password': customer.password,
        repeatedPassword: customer.password,
      },
    });

    // Rejections also return 200, so only the success text is reliable (DEF-001).
    const body = await response.text();
    expect(body, 'registration was rejected - see DEF-001').toContain(
      'Your account was created successfully',
    );

    await use(customer);
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  accountsOverviewPage: async ({ page }, use) => use(new AccountsOverviewPage(page)),
  openAccountPage: async ({ page }, use) => use(new OpenAccountPage(page)),
  transferPage: async ({ page }, use) => use(new TransferPage(page)),
  billPayPage: async ({ page }, use) => use(new BillPayPage(page)),

  authedPage: async ({ page, registeredCustomer, loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login(registeredCustomer.username, registeredCustomer.password);
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
    await use(page);
  },
});

export { expect };