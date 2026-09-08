# parabank-playwright-ts

![e2e](https://github.com/gavenjohn/parabank-playwright-ts/actions/workflows/e2e.yml/badge.svg)

UI and API test automation for [ParaBank](https://github.com/parasoft/parabank), a demo
banking application, using Playwright and TypeScript. The application under test runs in
a Docker container that the pipeline starts itself.

Six tests cover registration, login, the accounts overview, opening an account, and a
funds transfer. Three defects were found in the application while writing them and are
documented in [`docs/defects/`](docs/defects/).

## Stack

| | |
|---|---|
| Test framework | Playwright (`@playwright/test`) + TypeScript |
| Application under test | `parasoft/parabank`, pinned by image digest |
| CI | GitHub Actions, Ubuntu runner |
| Browser | Chromium |

## Running it

```bash
npm ci
npx playwright install --with-deps chromium

docker compose up -d              # start ParaBank on localhost:8080
bash scripts/wait-for-parabank.sh # wait for the WAR to finish deploying

npm test                          # or: npx playwright test
npm run typecheck
```

`BASE_URL` overrides the target if you run the container on a different port.

## Repo layout

```
docker-compose.yml                  ParaBank, pinned by digest
playwright.config.ts
scripts/wait-for-parabank.sh
.github/workflows/e2e.yml
src/
  data/customer-factory.ts          generates a unique customer per test
  fixtures/test-fixtures.ts         registeredCustomer + authedPage
  setup/global-setup.ts             creates the ParaBank schema
tests/
  fixtures/customer-fixture.spec.ts guards the fixture itself
  ui/                               login, accounts overview, open account, transfer
docs/defects/                       DEF-001, DEF-002, DEF-003
```

## Notes on the approach

**The application runs in a container, not on the public demo instance.** Most ParaBank
suites point at the shared instance at parasoft.com, where other people's test data
changes account balances underneath the run. Owning the instance is what makes an
assertion like "the balance decreased by exactly $100" meaningful.

**The image ships with an empty database, so the suite creates the schema itself.**
`parasoft/parabank` contains no application tables on first boot — registration cannot
allocate a customer id and any page reading a configuration parameter returns 500. The
admin page's Initialize button cannot be scripted: its Spring `@ModelAttribute` method
reads the `Parameter` table to build the form, so on an empty schema it fails before the
handler runs. `initializeDB.htm` maps to a handler that binds no form and performs the
same initialisation, so it works on an empty schema.

That runs in `globalSetup` rather than as a CI step, deliberately. It was originally a
CI step, and the suite passed locally for days while every CI run failed — the local
container had been initialised by hand on day one and kept the schema, while CI built a
fresh one each time. Putting setup in the suite means a local run and a CI run cannot
disagree about how the environment was prepared.

**Test data is created over the registration form endpoint, not through the browser.**
ParaBank has no JSON registration endpoint, so the fixture posts the form directly:
roughly 200ms instead of 6s, and no coupling between every test and the registration UI.
A GET on `/parabank/register.htm` before the POST is required — the POST binds against a
form object that GET creates.

**Every test gets its own customer.** Shared fixture data meant tests interfered through
the account list. A fresh customer per test removes the shared state rather than working
around it.

**Assertions check state, not messages.** The transfer test reads both balances before
and after and asserts the exact delta. "Transfer Complete!" appearing while the money did
not move is precisely the defect worth catching, and a success-message assertion passes
straight through it. That approach is what found DEF-002.

**Locators.** Captured with `npx playwright codegen` and cleaned by hand — role- and
name-based where possible, no `waitForTimeout`, no positional CSS chains. ParaBank is an
old JSP application that uses bold text where labels should be, so `getByLabel` does not
work on several pages and `input[name=...]` is the honest choice there.

**`retries: 1` in CI, `0` locally.** One retry keeps genuine flake visible in the report
instead of failing the build outright; zero locally means flake surfaces while the test
is being written rather than being smoothed over. `trace: 'on-first-retry'` and
`screenshot: 'only-on-failure'` mean a CI failure arrives with a full trace attached, and
the report is uploaded as an artifact on every run, including failures.

## Known limitations

**`workers: 1`.** Not a stylistic choice and no longer a stopgap. ParaBank rejects
concurrent registrations as "This username already exists" for usernames that are
provably free (DEF-003), and registration is the first thing every test does. Measured at
roughly one failure in six with six workers. Serialising is the only fix available from
the test side, because the defect is server-side.

## Defects found

| | | |
|---|---|---|
| [DEF-001](docs/defects/DEF-001-username-length-reported-as-duplicate.md) | Medium | Usernames over 20 characters are rejected as "already exists". The real constraint is length; confirmed against the application's own DDL. |
| [DEF-002](docs/defects/DEF-002-transfer-permits-negative-balance.md) | High | A transfer is authorised for more than the available balance, leaving the account below the configured minimum. |
| [DEF-003](docs/defects/DEF-003-concurrent-registration-false-duplicate.md) | High | Concurrent registrations are rejected as duplicates for usernames that never existed, and the customer is never created. |

## Not done yet

Page Object Model refactor, cross-browser coverage (Firefox/WebKit), axe-core
accessibility checks, and Qase reporting.
