// frontend/tests/a11y.spec.js
// WCAG 2/2.1 A+AA, serious+critical gate, both themes, populated fixtures
// (empty tables scan zero cells - see tests/helpers/api.js's header comment
// for why that hides real contrast/focus defects). Runs across all three
// viewport projects automatically since Playwright fans this file out per
// project in playwright.admin.config.js.
import { test, expect } from '@playwright/test';
import { stubApi } from './helpers/api.js';
import { seedSession, settle, ROLES } from './helpers/auth.js';
import { seedTheme } from './helpers/theme.js';
import { auditPage } from './helpers/audit.js';
import { ROUTES } from './helpers/routes.js';

for (const theme of ['light', 'dark']) {
  test.describe(`a11y: ${theme} theme`, () => {
    for (const route of ROUTES) {
      test(`${route.path} has no serious/critical violations`, async ({ page }, testInfo) => {
        await stubApi(page, { mode: 'populated' });
        await seedSession(page, { role: ROLES.SUPER_ADMIN });
        await seedTheme(page, theme);
        await page.goto(route.path);
        await settle(page);

        const { blocking } = await auditPage(page, testInfo, { include: '.admin-portal' });
        expect(blocking, `${blocking.length} blocking violation(s) on ${route.path} (${theme}) - see attached axe-report.txt`).toEqual([]);
      });
    }
  });
}

test.describe('a11y: modal-heavy surfaces', () => {
  test('Catalogue "Add item" modal has no serious/critical violations', async ({ page }, testInfo) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/catalogue');
    await settle(page);

    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const { blocking } = await auditPage(page, testInfo, { include: '.admin-portal' });
    expect(blocking, formatMessage(blocking, 'Catalogue add-item modal')).toEqual([]);
  });

  test('Overdues bulk-waive modal has no serious/critical violations', async ({ page }, testInfo) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/overdues');
    await settle(page);

    const firstCheckbox = page.locator('.data-table tbody input[type="checkbox"]').first();
    await firstCheckbox.check();
    await page.getByRole('button', { name: /Waive \d+ selected/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const { blocking } = await auditPage(page, testInfo, { include: '.admin-portal' });
    expect(blocking, formatMessage(blocking, 'Overdues bulk-waive modal')).toEqual([]);
  });
});

function formatMessage(blocking, label) {
  return `${blocking.length} blocking violation(s) on ${label} - see attached axe-report.txt`;
}
