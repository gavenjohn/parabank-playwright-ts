# DEF-001 — Registration rejects a unique username as "already exists" when submitted programmatically

**Severity:** Medium   **Priority:** Medium
**Found:** while building an API-first test data fixture
**Environment:** parasoft/parabank:latest, local Docker, Playwright 1.6x request context

## Steps
1. GET `/parabank/register.htm` to establish a session.
2. POST `/parabank/register.htm` form-encoded with all eleven fields
   (`customer.firstName` … `customer.username`, `customer.password`, `repeatedPassword`),
   using a timestamp-and-random generated username, e.g. `user_1788818640742669`.

## Expected
Customer created; the username has never been used.

## Actual
HTTP 200. The registration form is re-rendered with submitted values echoed back and
`<span id="customer.username.errors">This username already exists.</span>`.
The customer is not created — logging in with those credentials fails.

## What was ruled out
- **Wrong field names** — the form echoes every submitted value back correctly.
- **Missing session** — `JSESSIONID` is present and shared between the GET and the POST.
- **Missing CSRF token** — no hidden inputs in the rendered form.
- **Missing `Referer` / `Origin` headers** — added; no change.
- **Genuine collision** — usernames are timestamp-derived and confirmed absent via manual login.

## Notes
The same registration succeeds through the browser UI, so the uniqueness check appears to
behave differently for a request that did not originate from a rendered form submission.
Impact is on programmatic test data setup rather than on end users, hence Medium severity.

## Status
Open. Test data setup falls back to a seeded customer; the fixture is retained but skipped.
