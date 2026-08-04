// frontend/tests/smoke.spec.js
// Every route loads for a role that should see it, and role gating actually
// redirects away for one that shouldn't - proving nav visibility and route
// guards read the same source of truth (constants/nav.js) rather than
// drifting apart. Runs against populated fixtures so table/detail rendering
// is exercised, not just an empty shell.
import { test, expect } from '@playwright/test';
import { stubApi } from './helpers/api.js';
import { seedSession, settle, ROLES } from './helpers/auth.js';
import { ROUTES, routesFor } from './helpers/routes.js';

test.describe('smoke: role-gated navigation', () => {
  for (const role of Object.values(ROLES)) {
    test(`${role} lands on an accessible page and sees only its own nav links`, async ({ page }) => {
      await stubApi(page, { mode: 'populated' });
      await seedSession(page, { role });
      await page.goto('/admin');
      await settle(page);

      const accessible = routesFor(role);
      const expectedLanding = accessible.some((r) => r.key === 'dashboard') ? '/admin' : accessible[0].path;
      await expect(page).toHaveURL(new RegExp(`${expectedLanding}$`));

      const nav = page.getByRole('navigation', { name: 'Admin navigation' });
      for (const route of ROUTES) {
        const link = nav.getByRole('link', { name: route.label });
        if (accessible.some((r) => r.key === route.key)) {
          await expect(link).toBeVisible();
        } else {
          await expect(link).toHaveCount(0);
        }
      }
    });
  }

  for (const route of ROUTES) {
    test(`${route.path} renders for a role that can reach it (SUPER_ADMIN)`, async ({ page }) => {
      await stubApi(page, { mode: 'populated' });
      await seedSession(page, { role: ROLES.SUPER_ADMIN });
      await page.goto(route.path);
      await settle(page);
      await expect(page.getByRole('heading', { name: route.label, level: 1 })).toBeVisible();
    });
  }

  test('DESK_STAFF is redirected away from a LIBRARIAN+ route (Overdues), not shown its content', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.DESK_STAFF });
    await page.goto('/admin/overdues');
    await settle(page);
    await expect(page).not.toHaveURL(/\/admin\/overdues$/);
    await expect(page.getByRole('heading', { name: 'Overdues', level: 1 })).toHaveCount(0);
  });

  test('LIBRARIAN is redirected away from the SUPER_ADMIN-only Staff route', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.LIBRARIAN });
    await page.goto('/admin/staff');
    await settle(page);
    await expect(page).not.toHaveURL(/\/admin\/staff$/);
    await expect(page.getByRole('heading', { name: 'Staff', level: 1 })).toHaveCount(0);
  });
});
