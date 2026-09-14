# DEF-002 — Transfer succeeds when the amount exceeds the available balance, driving the account negative

**Severity:** High   **Priority:** High
**Found:** while building the funds-transfer test
**Environment:** parasoft/parabank:latest, local Docker

## Preconditions

The manual steps below were run with Min. Balance set to $0.00 on `/parabank/admin.htm`.
That is not the default — a freshly initialised database seeds $100.00, and the suite's
`globalSetup` reinitialises it on every run — so reapply the setting before following them.

The setting is not required to reproduce the defect. The regression test sets Min. Balance
to $100.00, opens a second account (which moves $100), then transfers the original balance
plus $50. The transfer is authorised and leaves the account at -$150.00.

## Steps
1. Register a new customer. The initial account (14787) opens with $515.50.
2. Open a second account (15675) with an opening balance of $0.00.
3. Confirm Min. Balance is $0.00 on the admin page.
4. Transfer $600.00 from 14787 to 15675.

## Expected
Rejected with a validation error. $600.00 exceeds both the available balance and the
configured minimum balance of $0.00.

## Actual
"Transfer Complete! $600.00 has been transferred from account #14787 to account #15675."

Accounts Overview afterwards:

| Account | Balance | Available Amount |
|---|---|---|
| 14787 | −$84.50 | $0.00 |
| 15675 | $600.00 | $600.00 |

The source account is $84.50 below the configured minimum.

## Notes
The Available Amount column correctly shows $0.00 for the overdrawn account, so the
application already computes availability — it just does not consult it before
authorising the transfer. The check appears to be missing at the point of transfer
rather than absent from the system.

Total across accounts remains $515.50, so funds are conserved; this is an authorisation
failure, not a ledger corruption.

## Impact
A customer can move money they do not have. In a real banking context this is an
unauthorised overdraft.

## Status
Open. Encoded as an expected failure in `tests/business-rules/min-balance.spec.ts`.
