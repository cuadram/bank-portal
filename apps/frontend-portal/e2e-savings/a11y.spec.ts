import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const FE = 'http://localhost:4201';

// Páginas públicas que el axe puede auditar sin login (login + landing)
test.describe('WCAG 2.1 AA · páginas públicas', () => {
  test('TC-A11Y-001 · página de login no tiene violaciones críticas', async ({ page }) => {
    await page.goto(FE + '/auth/login');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (critical.length > 0) {
      console.log('Violations critical/serious:');
      for (const v of critical) console.log('  -', v.id, '·', v.help, '·', v.nodes.length, 'nodos');
    }
    console.log('Total violations:', results.violations.length, '· critical/serious:', critical.length);
    expect(critical.length, 'No debe haber violaciones críticas o serias WCAG').toBe(0);
  });
});
