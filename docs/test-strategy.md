# Test strategy

Scope, risk basis, layering and exclusions for this suite. How it is built and run is in
the [README](../README.md); the defects it found are in [`defects/`](defects/).

## Scope

**In scope:** the banking application a customer uses — login, and the Account Services
pages ParaBank shows after it: Accounts Overview, Open New Account, Transfer Funds, Bill
Pay, Find Transactions, Update Contact Info and Request Loan — plus the REST endpoints
behind them under `/parabank/services/bank/`, and the accessibility of the pages a customer
reaches first.

**Out of scope:** the parts of the image that are not the banking application — the
bookstore demo, the SOAP and JMS services, and the external loan-provider integrations —
and the admin console, apart from the one setting a business rule depends on.

## Risk basis

Coverage is weighted by what a bank loses if the behaviour is wrong.

| Risk | Why it ranks here | How it is covered |
|---|---|---|
| Money moves incorrectly | Wrong balances and unauthorised overdrafts are direct financial loss | Transfer and bill pay assert exact balance deltas; loan rules are asserted at the API; minimum balance is an expected failure (DEF-002) |
| Data is exposed | Leaked credentials or PII are a regulatory and trust failure | The login endpoint's credential and SSN exposure is an expected failure (DEF-005) |
| Customers cannot get in | Nothing else works if login does not | Valid and invalid login through the UI; most tests log in a freshly registered customer |
| Customers with disabilities cannot use it | A blocked customer, and compliance exposure for a financial institution | axe-core on the login page and accounts overview (DEF-004) |
| API contracts drift | Consumers break without any visible error | Zod schema validation of account, transaction and loan responses |
| Presentation | Rarely costs money on its own | Only where a rendering fault would hide a data fault, such as a balance that is not a number |

## What is automated, and at which layer

Rules and data contracts are tested at the API. Journeys a customer performs are tested
through the UI, and assert the resulting state rather than a confirmation message.

| Layer | Tests | Covers |
|---|---|---|
| API | 12 | Account and transaction lookups by id, amount, date and date range; loan approval and both denial rules; the login endpoint |
| UI | 7 | Login with a valid and an invalid password, accounts overview, open account, transfer, bill pay, and a guard test for the customer fixture |
| Business rules | 1 | Minimum balance on transfer — it spans an admin setting and a customer action, so it drives both pages |
| Accessibility | 2 | axe-core scans of the login page and accounts overview, serious and critical violations only |

All 22 tests run in Chromium, Firefox and WebKit. `globalSetup` creates the database schema
before every run, and each test that needs a customer registers its own by posting the
registration form, so no test depends on data another test created.

## Expected failures

Deterministic defects are encoded as tests that assert the correct behaviour and are
marked `test.fail()`: DEF-002 (1 test), DEF-004 (2) and DEF-005 (1). The build stays green
and the report lists them as expected failures, each citing its defect document.

An expected-failure test passes whenever it fails, for any reason. When one of these
defects is reported fixed, re-check the test by hand rather than relying on it to flip.

## Deliberately not automated

| What | Why |
|---|---|
| DEF-003, concurrent write failures | Nondeterministic. A test for it would pass most runs and fail at random — flaky by construction. It is documented, and avoided by running serially. |
| Load and performance | The application is one demo container on a shared CI runner, and its table-level locking already fails under modest concurrency (DEF-003). Timings would measure the environment, not the product. |
| Admin settings, beyond minimum balance | They are global to the container, so changing one in a test changes the conditions of every other test. The loan tests rely on the default loan processor instead of configuring it. The minimum-balance test changes its setting and restores it, which is safe only because the suite runs serially. |
| The public ParaBank instance | Shared with other users, whose activity changes balances mid-run. |
| Bookstore, SOAP, JMS and loan-provider integrations | Bundled with the image, but not part of the banking application. |

## Not yet covered

Gaps rather than decisions, and the first candidates for further work:

- Find Transactions, Update Contact Info and Request Loan through the UI. Transaction
  lookups and loan rules are covered at the API.
- The registration page itself — its field validation, and the DEF-001 length boundary as
  a test. Every test registers through the form endpoint, but nothing checks what the page
  shows a customer.
- Accessibility beyond the login page and accounts overview.
- Mobile viewports and visual regression.
