import { type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// A legacy JSP app like ParaBank surfaces many low-impact WCAG issues -
// heading order, redundant alt text - that would make the suite noisy and
// low-signal if it failed on everything axe reports. Failing only on
// serious/critical keeps the check meaningful.
export async function seriousOrCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
}