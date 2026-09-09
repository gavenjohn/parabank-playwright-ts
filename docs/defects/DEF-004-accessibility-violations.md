# DEF-004 — Multiple WCAG 2 AA violations across login and authenticated pages

**Severity:** High   **Priority:** High
**Found:** automated axe-core scan, `tests/a11y/accessibility.spec.ts`
**Environment:** parasoft/parabank:latest, axe-core via @axe-core/playwright, chromium

## Summary

Both pages scanned fail WCAG 2 AA. Two failure classes:

**Shared header/footer template (every page, including this app's login form):**
- `html-has-lang` (serious) — `<html>` has no `lang` attribute
- `image-alt` (critical) — the admin-panel nav icon has no alt text
- `link-name` (serious) — that icon's enclosing `<a>` has no accessible name; it is in the tab order and silent to a screen reader
- `color-contrast` (serious) — the header tagline (3.84:1) and two footer links (3.97:1) fall under the 4.5:1 minimum

**Page-specific:**
- Login only — `label` (critical): the username and password inputs have no implicit, explicit, `aria-label`, or `aria-labelledby` label. A screen reader user cannot determine what to type into either field of a bank login form.
- Login only — three further `color-contrast` failures in the promotional panel (2.95:1)
- Accounts Overview only — `color-contrast` (serious) on the balance disclaimer, **2.31:1**, the lowest ratio found anywhere in the app

## Impact

The `label` finding is the most severe from a real-user standpoint: a screen-reader user cannot identify the login fields on a banking application. `image-alt`/`link-name` leave an interactive, focusable element with no accessible name anywhere in the app. Several cited criteria (Section 508, EN 301 549) carry legal compliance weight for financial institutions specifically.

## Status

Open, third-party application. Encoded as two `test.fail()` regression tests so CI reflects the real state without failing the build on every run. If ParaBank remediates any of these, the corresponding test becomes an unexpected pass, which is a clear automated signal to update this document.