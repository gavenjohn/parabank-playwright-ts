import { test, expect } from '../../src/fixtures/test-fixtures';
import { seriousOrCriticalViolations } from '../../src/a11y/axe-helper';

test.describe('Accessibility', () => {
  // DEF-004. Expected to fail: unlabelled username and password inputs, an
  // admin icon with no alt text or accessible name, no lang on <html>, and six
  // contrast failures.
  test('login page has no serious or critical violations', async ({ loginPage }) => {
    test.fail();
    await loginPage.goto();
    const violations = await seriousOrCriticalViolations(loginPage.page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  // DEF-004. Expected to fail: the shared-template violations above, plus one
  // further contrast failure on the balance disclaimer (2.31:1).
  test('accounts overview has no serious or critical violations', async ({
    authedPage, accountsOverviewPage,
  }) => {
    test.fail();
    await accountsOverviewPage.goto();
    const violations = await seriousOrCriticalViolations(authedPage);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});