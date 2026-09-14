# parabank-playwright-ts

![e2e](https://github.com/gavenjohn/parabank-playwright-ts/actions/workflows/e2e.yml/badge.svg)

UI, API and accessibility test automation for [ParaBank](https://github.com/parasoft/parabank),
a demo banking application, using Playwright and TypeScript. The application under test
runs in a Docker container that the pipeline starts itself.

**23 tests, each run in Chromium, Firefox and WebKit — 69 executions per run.** 18 assert
correct behaviour. 5 are expected failures (`test.fail()`) that encode open defects in the
application, so the build stays green while the defects stay visible in the report. Five
defects are documented in [`docs/defects/`](docs/defects/), and the reasoning behind what
is and isn't automated is in [`docs/test-strategy.md`](docs/test-strategy.md).

## Coverage

| Layer | Tests | Covers |
|---|---|---|
| UI | 7 | Login with a valid and an invalid password, accounts overview, open account, funds transfer, bill pay, and a guard test for the customer fixture |
| API | 13 | Account and transaction lookups — by id, amount, date and date range — validated against Zod schemas; loan approval and both denial rules; the login endpoint's credential handling and SSN exposure (DEF-005, expected failures) |
| Business rules | 1 | Minimum balance enforced on transfer (DEF-002, expected failure) |
| Accessibility | 2 | axe-core scans of the login page and accounts overview (DEF-004, expected failures) |

## Stack

| | |
|---|---|
| Test framework | Playwright (`@playwright/test`) + TypeScript |
| API schema validation | Zod |
| Accessibility | `@axe-core/playwright` |
| Application under test | `parasoft/parabank`, pinned by image digest |
| CI | GitHub Actions, Ubuntu runner |
| Browsers | Chromium, Firefox, WebKit |

## Running it

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit

docker compose up -d              # start ParaBank on localhost:8080
bash scripts/wait-for-parabank.sh # wait for the WAR to finish deploying

npm run typecheck
npm test                                 # all three browsers
npx playwright test --project=chromium   # one browser
```

`BASE_URL` overrides the target if you run the container on a different port.

## Repo layout

```
docker-compose.yml                  ParaBank, pinned by digest
playwright.config.ts
scripts/wait-for-parabank.sh
.github/workflows/e2e.yml
src/
  setup/global-setup.ts             creates the ParaBank schema before the run
  fixtures/test-fixtures.ts         registeredCustomer, authedPage, page object fixtures
  data/customer-factory.ts          a unique customer per test
  pages/                            login, accounts overview, open account, transfer,
                                    bill pay, admin
  api/schemas.ts                    Zod schemas for API responses
  a11y/axe-helper.ts                serious and critical axe violations
tests/
  ui/                               customer journeys
  api/                              REST endpoints
  business-rules/                   rules spanning admin settings and customer actions
  a11y/                             accessibility scans
  fixtures/customer-fixture.spec.ts guards the fixture itself
docs/
  test-strategy.md
  defects/                          DEF-001 to DEF-005
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

That runs in `globalSetup` rather than as a CI step, deliberately. It was originally a CI
step, and the suite passed locally for days while every CI run failed — the local
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

**Page objects hold locators and page actions.** Specs read as the scenario and its
assertions; `src/pages/` is the only place a locator is written.

**Assertions check state, not messages.** The transfer and bill pay tests read balances
before and after and assert the exact delta. "Transfer Complete!" appearing while the money
did not move is precisely the defect worth catching, and a success-message assertion
passes straight through it. That approach is what found DEF-002.

**API responses are validated against schemas.** Each response is parsed with a Zod schema
from `src/api/schemas.ts`, so a missing, renamed or retyped field fails the test instead of
slipping past a check on one property.

**Open defects are encoded as expected failures.** Where a defect is deterministic, the
test asserts the correct behaviour and is marked `test.fail()`, with a comment citing its
defect document. The build stays green, and the report still lists the check rather than
hiding it in a skipped test.

**Accessibility checks fail only on serious and critical violations.** ParaBank reports
many minor issues; failing on all of them would bury the ones that block users.

**Locators.** Captured with `npx playwright codegen` and cleaned by hand — role- and
name-based where possible, no `waitForTimeout`, no positional CSS chains. ParaBank is an
old JSP application that uses bold text where labels should be, so `getByLabel` does not
work on several pages and `input[name=...]` is the honest choice there.

**`retries: 1` in CI, `0` locally.** One retry keeps genuine flake visible in the report
instead of failing the build outright; zero locally means flake surfaces while the test is
being written rather than being smoothed over. `trace: 'on-first-retry'` and
`screenshot: 'only-on-failure'` mean a CI failure arrives with a full trace attached, and
the report is uploaded as an artifact on every run, including failures.

## Known limitations

**`workers: 1`.** ParaBank allocates ids with an unlocked read-then-update under
table-level database locking, so concurrent creates either collide on an id or deadlock
(DEF-003). Every test registers a customer, so parallel runs fail intermittently: 3 of 9
runs at 2 and 4 workers had failures, and none has been observed serially. The defect is
server-side, so serialising is the only fix from the test side. It costs roughly 80–90
seconds per local run against about 45 at four workers.

## Defects found

| | Severity | |
|---|---|---|
| [DEF-001](docs/defects/DEF-001-username-length-reported-as-duplicate.md) | Medium | Usernames over 20 characters are rejected as "already exists". The real constraint is column length; registration reports every integrity failure as a duplicate username. |
| [DEF-002](docs/defects/DEF-002-transfer-permits-negative-balance.md) | High | A transfer is authorised for more than the available balance, leaving the account below the configured minimum. Encoded as an expected failure. |
| [DEF-003](docs/defects/DEF-003-concurrent-registration-false-duplicate.md) | High | Concurrent creates collide on id allocation or deadlock, losing the request — often reported as a duplicate username. The reason `workers` is 1. |
| [DEF-004](docs/defects/DEF-004-accessibility-violations.md) | High | WCAG 2 AA failures on the login page and accounts overview, including login fields with no accessible label. Encoded as expected failures. |
| [DEF-005](docs/defects/DEF-005-login-endpoint-exposes-credentials-and-pii.md) | Critical | A REST login endpoint accepts credentials in the URL path and returns the customer's SSN. Encoded as two expected failures. |

## Roadmap

- Qase test management reporting — deferred.
