import { test as base, expect, type Page } from '@playwright/test';
import { newCustomer, type Customer } from '../data/customer-factory';
import { LoginPage } from '../pages/login.page';
import { AccountsOverviewPage } from '../pages/accounts-overview.page';
import { OpenAccountPage } from '../pages/open-account.page';
import { TransferPage } from '../pages/transfer.page';

type Fixtures = {
  registeredCustomer: Customer;
  authedPage: Page;
  loginPage: LoginPage;
  accountsOverviewPage: AccountsOverviewPage;
  openAccountPage: OpenAccountPage;
  transferPage: TransferPage;
};

export const test = base.extend<Fixtures>({
  // ParaBank has no JSON registration endpoint, so this posts the registration
  // form directly. Still no browser involved: ~200ms instead of ~6s of form
  // filling, and it does not couple every test to the registration UI.
  registeredCustomer: async ({ request }, use) => {
    const customer = newCustomer();

    // The POST binds against a form object created by this GET. Without it
    // ParaBank returns a 500.
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

    // ParaBank returns 200 on failure too, so the status alone proves nothing -
    // the success text is the only reliable signal. See DEF-001.
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

  authedPage: async ({ page, registeredCustomer, loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login(registeredCustomer.username, registeredCustomer.password);
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
    await use(page);
  },
});

export { expect };