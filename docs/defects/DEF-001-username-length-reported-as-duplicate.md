# DEF-001 — Usernames over 20 characters are rejected as "already exists"

**Severity:** Medium   **Priority:** Medium
**Found:** while building an API-first test data fixture
**Environment:** parasoft/parabank:latest, local Docker

## Steps
1. GET `/parabank/register.htm`.
2. POST the registration form with all eleven fields and a 21-character username,
   e.g. `user_1788818640742669`.

## Expected
Either the customer is created, or a validation error naming the real problem —
that the username exceeds the maximum length.

## Actual
HTTP 200. The form is re-rendered with
`<span id="customer.username.errors">This username already exists.</span>`
for a username that has never been used. The customer is not created.

## Boundary
- 20 characters (`user_123456789012345`) — accepted
- 21 characters (`user_1788818640742669`) — rejected

The limit is 20 inclusive; 21 is the first failing length.

## Root cause

Confirmed from the application's own DDL, which ships inside the image at
`WEB-INF/classes/com/parasoft/parabank/dao/jdbc/sql/create.sql`:

```sql
username VARCHAR(20) NOT NULL,
...
UNIQUE (username)
```

The column is `VARCHAR(20)` and carries the `UNIQUE` constraint. An over-length
username fails at the database, and the handler reports that failure using the
message for the constraint it expected to be violated rather than the one that
actually was. The boundary found by varying input length matches the declared
column width exactly.

## What was ruled out
- **Wrong field names** — the form echoes every submitted value back correctly.
- **Missing session** — `JSESSIONID` present and shared between GET and POST.
- **CSRF token** — no hidden inputs in the rendered form.
- **`Referer` / `Origin` headers** — added; no change.
- **Genuine collision** — confirmed absent via manual login attempt.

## Impact
The misleading message is the defect. A caller shown "already exists" will retry with a
different username and keep failing, because length is the actual constraint. This cost
roughly an hour of investigation before input length was varied rather than input content.

## Notes
Also observed: the endpoint returns HTTP 200 for both success and rejection, so callers
cannot rely on status codes and must inspect the response body.

## Status
Open. Test data factory now generates usernames of 11 characters.
