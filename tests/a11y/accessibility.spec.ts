import { test, expect } from '../../src/fixtures/test-fixtures';
import { seriousOrCriticalViolations } from '../../src/a11y/axe-helper';

test.describe('Accessibility', () => {
  // DEF-004: the login form has no accessible labels on either input, the
  // nav icon has no alt text or accessible name, <html> has no lang
  // attribute, and six elements fail WCAG AA contrast. Third-party app,
  // cannot be patched - marked as expected failure so CI reflects reality
  // without going red on every run.
  test('login page has no serious or critical violations', async ({ loginPage }) => {
    test.fail();
    await loginPage.goto();
    const violations = await seriousOrCriticalViolations(loginPage.page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  // DEF-004: see login page test above for the shared-template defects
// (html-has-lang, image-alt, link-name on the admin icon). This page adds a
// fifth contrast failure independent of those - the balance disclaimer at
// 2.31:1, the worst ratio found in the app. No label failures here since
// the authenticated page has no form.
test('accounts overview has no serious or critical violations', async ({
  authedPage, accountsOverviewPage,
}) => {
  test.fail();
  await accountsOverviewPage.goto();
  const violations = await seriousOrCriticalViolations(authedPage);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
});