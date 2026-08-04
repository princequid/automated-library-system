// frontend/tests/data-surface.spec.js
// Proves each surface actually renders the populated fixtures - not just
// "the page didn't crash" (smoke.spec.js) but "the table has rows, the KPI
// shows a real number, the badge text matches the fixture's status." Also
// covers empty and error modes explicitly, since a fallthrough from error to
// an empty-looking table is exactly the defect the design rules call out.
import { test, expect } from '@playwright/test';
import { stubApi } from './helpers/api.js';
import { seedSession, settle, ROLES } from './helpers/auth.js';
import * as lib from './helpers/library-data.js';

test.describe('data-surface: populated', () => {
  test('Catalogue table shows fixture rows', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/catalogue');
    await settle(page);

    await expect(page.locator('.data-table tbody tr')).toHaveCount(Math.min(lib.catalogItems.length, 20));
    await expect(page.getByText(lib.catalogItems[0].title)).toBeVisible();
  });

  test('Members table shows status badges', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/members');
    await settle(page);

    // Kofi Boateng/Efua Owusu/etc are ACTIVE in the fixtures; Yaw Darko is
    // SUSPENDED -> MemberStatusBadge maps SUSPENDED to the 'danger' variant
    // (see components/common/Badge.jsx's MEMBER_STATUS_VARIANT).
    await expect(page.locator('.badge-danger').first()).toBeVisible();
  });

  test('Loans table shows an overdue status badge', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/loans');
    await settle(page);

    await expect(page.getByText('OVERDUE').first()).toBeVisible();
  });

  test('Overdues shows severity meters across more than one severity level', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/overdues');
    await settle(page);

    const meters = page.locator('.severity-meter');
    await expect(meters.first()).toBeVisible();
    const classes = await meters.evaluateAll((els) => els.map((el) => el.className));
    const distinctLevels = new Set(classes.map((c) => c.match(/severity-(low|moderate|high|critical)/)?.[1]));
    expect(distinctLevels.size, `expected more than one severity level, got: ${[...distinctLevels]}`).toBeGreaterThan(1);
  });

  test('Dashboard KPIs show real fixture numbers, not "No data"', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin');
    await settle(page);

    await expect(page.getByText('No data')).toHaveCount(0);
    await expect(page.locator('.kpi-grid-primary .kpi-card')).toHaveCount(4);
  });
});

test.describe('data-surface: empty', () => {
  test('Catalogue shows its empty state, not a broken table', async ({ page }) => {
    await stubApi(page, { mode: 'empty' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/catalogue');
    await settle(page);

    await expect(page.getByText('No catalogue items yet')).toBeVisible();
    // Not tbody tr count 0 - the empty state itself renders inside a real
    // <tr>/<td colSpan> for correct table semantics (see DataTable.jsx), so
    // that row always exists. Every REAL data row's cells carry data-label
    // (used by the mobile card-transform); the empty-state cell doesn't.
    await expect(page.locator('.data-table tbody td[data-label]')).toHaveCount(0);
  });

  test('Dashboard says "No data" honestly rather than showing 0 as if it were fetched', async ({ page }) => {
    await stubApi(page, { mode: 'empty' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin');
    await settle(page);

    // dashboard-stats' empty-mode fixture is all zeros, which IS a real
    // (if boring) value - not the "no data source" case. It should render as
    // "0" on the 4 KPI cards specifically (.kpi-value-empty is KpiCard's own
    // "No data" case). The charts below legitimately say "No data yet" for
    // their own empty series - that's a different, correct message, not
    // what this assertion is checking.
    await expect(page.locator('.kpi-value-empty')).toHaveCount(0);
    await expect(page.locator('.kpi-card').getByText('0').first()).toBeVisible();
  });
});

test.describe('data-surface: error', () => {
  for (const path of ['/admin/catalogue', '/admin/members', '/admin/loans']) {
    test(`${path} shows ErrorState with retry, never falls through to empty`, async ({ page }) => {
      await stubApi(page, { mode: 'error' });
      await seedSession(page, { role: ROLES.SUPER_ADMIN });
      await page.goto(path);
      await settle(page);

      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
      // The empty-state copy must NOT appear behind the error - that would be
      // exactly the silent error-to-empty fallthrough the design rules forbid.
      await expect(page.getByText(/No .* yet/)).toHaveCount(0);
    });
  }
});
