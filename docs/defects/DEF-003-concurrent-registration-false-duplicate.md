# DEF-003 — Concurrent registrations are rejected as "This username already exists"

**Severity:** High   **Priority:** Medium
**Found:** while attempting to restore parallel test execution
**Environment:** parasoft/parabank:latest, local Docker, freshly initialised database

## Summary

When registration requests arrive concurrently, some are rejected with
"This username already exists." for usernames that have never been registered. The
rejected registration is not created, so a caller loses the request entirely.

## Steps
1. Initialise the database (`GET /parabank/initializeDB.htm`) so no customers exist
   beyond the seeded `john` and `parasoft`.
2. Issue ten registration POSTs concurrently, each in its own session, with usernames
   `par_1` … `par_10`. The names are fixed and distinct, so no collision is possible
   by construction.

## Expected
All ten succeed. Every username is unique and none existed beforehand.

## Actual
Nine succeed. One — `par_1` — is rejected:

```
<span id="customer.username.errors" class="error">This username already exists.</span>
```

The container log shows the application reaching that conclusion itself, rather than
the message being a mis-mapped database error:

```
00:56:51.296 [http-nio-8080-exec-8]  JdbcCustomerDao - Getting customer object for id = 12434
00:56:51.297 [http-nio-8080-exec-10] WARN RegisterCustomerController
                                     - Username par_1 already exists in database
```

`par_1` genuinely does not exist afterwards. Logging in with it fails:

| Username | Registration result | Login afterwards |
|---|---|---|
| `par_1` | rejected as duplicate | `could not be verified` |
| `par_2` | created | Accounts Overview |
| `par_5` | created | Accounts Overview |

So the duplicate check returned a false positive, and the customer was never created.

## Analysis

The false positive originates in the duplicate check, not in error reporting — the
controller logs its own belief that the username exists. The behaviour is consistent
with the lookup not being isolated from other in-flight registrations, for example a
DAO whose connection or statement state is shared across request threads. The exact
mechanism was not confirmed; what is confirmed is that the check reports a username as
taken when it is not, and only under concurrency.

This is distinct from [DEF-001](DEF-001-username-length-reported-as-duplicate.md),
where the same message is produced deterministically by an over-length username. The
shared symptom is that "This username already exists." is not reliable evidence that a
username exists.

## Impact

A customer registering at a busy moment is told to pick a different username, and the
name they were told to abandon is still free. There is no retry or recovery: the
request is simply lost.

For this suite it is the reason `workers` remains 1. Registration is the first thing
every test does, so parallel execution fails roughly one test in six — and the failures
land on whichever test happened to race, which reads as flake rather than as a product
defect.

## Status
Open. `workers: 1` in `playwright.config.ts` avoids it; see the comment there.
