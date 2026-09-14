import { type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Serious and critical only: ParaBank also reports many minor issues
// (heading order, redundant alt text) that would bury the blocking ones.
export async function seriousOrCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
}