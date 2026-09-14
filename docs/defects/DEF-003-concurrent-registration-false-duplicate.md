# DEF-003 — Concurrent writes fail intermittently; registration reports it as "This username already exists"

**Severity:** High   **Priority:** Medium
**Found:** while attempting to run the suite with more than one worker
**Environment:** parasoft/parabank:latest, local Docker, HSQLDB as shipped in the image

## Summary

When customers or accounts are created concurrently, some requests fail. A failed
registration is either rejected with "This username already exists." for a username that
has never been used, or returns an error page. The customer is not created in either case,
so the request is lost.

## Reproducing

Intermittent and timing-dependent. The most reliable reproduction is the suite itself,
run in parallel against the container:

```
npx playwright test --workers=4
```

Observed on 14 September 2026, 22 tests across three browsers (66 executions per run):

| Workers | Runs | Runs with failures | Unexpected failures |
|---|---|---|---|
| 1 | local run + CI runs #22–#25 | 0 | 0 |
| 2 | 3 | 1 | 2 |
| 4 | 6 | 2 | 3 |

Concurrent registration without Playwright also triggers it, but less reliably: ten
simultaneous POSTs, each in its own session, lost one registration on 7 September 2026;
five rounds of ten on 14 September lost none.

## Actual

Three failure shapes, seen only under concurrency:

1. **False duplicate username.** The registration form re-renders with
   `This username already exists.` and the container logs
   `WARN RegisterCustomerController - Username u_… already exists in database`.
   The username cannot log in afterwards (verified for `par_1` on 7 September).
2. **Error page on create.** Registration or Open New Account fails, and the container logs:

   ```
   CannotAcquireLockException: PreparedStatementCallback;
     SQL [INSERT INTO Account (id, customer_id, type, balance) VALUES (?, ?, ?, ?)]
   Caused by: org.hsqldb.HsqlException: transaction rollback: serialization failure
   ```

3. **Navigation that does not finish within five seconds**, after login or when opening
   Accounts Overview, with nothing logged. Consistent with requests waiting on table
   locks; not confirmed.

## Root cause

Confirmed from the application's bytecode and configuration inside the image.

- **Ids are allocated with an unlocked read-then-update.** `JdbcSequenceDao.getNextId`
  runs `SELECT next_id FROM Sequence WHERE name = ?`, then, as a separate statement,
  `UPDATE Sequence SET next_id = ? WHERE name = ?`. Two transactions that both read before
  either updates are given the same id.
- **HSQLDB uses table-level two-phase locking.** The database is configured with
  `SET DATABASE TRANSACTION CONTROL LOCKS` and `TRANSACTION ROLLBACK ON CONFLICT TRUE`, and
  every `BankManager` method runs in a Spring transaction. Creating a customer updates
  `Sequence` and inserts into `Customer` and `Account` in one transaction, so concurrent
  writers can block each other; HSQLDB resolves the conflict by rolling one back with a
  serialization failure. That is failure shape 2.
- **Registration mislabels integrity failures.** `RegisterCustomerController.onSubmit`
  wraps customer creation in `catch (DataIntegrityViolationException)` and reports every
  such failure as `error.username.already.exists`, logging the warning above. It never
  looks the username up. For a valid, never-used username, the constraint left to fail is
  a primary key — which is what a duplicated id violates. That is failure shape 1. The
  exception is swallowed, so the duplicate key is inferred, not observed.

An earlier version of this report attributed the false positive to a duplicate-username
check that was not isolated between requests. That was wrong: no such check exists.

[DEF-001](DEF-001-username-length-reported-as-duplicate.md) is the same mislabelling
applied to a different integrity failure, an over-length username.

## Impact

A customer who registers or opens an account while others are doing the same can be told
their username is taken when it is free, or shown an error page, and the request is lost.
Any real concurrency can trigger it; fewer simultaneous requests only make it rarer.

For this suite it is why `workers` is 1. Every test registers a customer and several open
accounts or move money, so parallel runs fail intermittently on whichever test lost the
race, which reads as flake rather than as a product defect.

## Status

Open, third-party application. Not encoded as a regression test: it is nondeterministic,
so a test for it would be flaky by construction. `workers: 1` in `playwright.config.ts`
avoids it; the defect is server-side, so serialising is the only test-side mitigation.
