// frontend/tests/responsive.spec.js
// No horizontal page overflow at any breakpoint, and the DataTable's
// card-transform (see styles/components.css's 767px media query) actually
// engages below 768px instead of just clipping a table off-screen.
import { test, expect } from '@playwright/test';
import { stubApi } from './helpers/api.js';
import { seedSession, settle, ROLES } from './helpers/auth.js';
import { ROUTES } from './helpers/routes.js';

test.describe('responsive layout', () => {
  for (const route of ROUTES) {
    test(`${route.path} has no horizontal overflow`, async ({ page }) => {
      await stubApi(page, { mode: 'populated' });
      await seedSession(page, { role: ROLES.SUPER_ADMIN });
      await page.goto(route.path);
      await settle(page);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `${route.path} scrolls horizontally (scrollWidth ${scrollWidth} > clientWidth ${clientWidth})`).toBeLessThanOrEqual(
        clientWidth + 1 // 1px rounding tolerance
      );
    });
  }

  test('mobile: sidebar opens via the hamburger and closes via the scrim', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only interaction');
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin');
    await settle(page);

    const nav = page.getByRole('navigation', { name: 'Admin navigation' });
    await expect(nav).not.toBeInViewport();

    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(nav).toBeInViewport();

    // Click near the right edge of the viewport, outside the sidebar's own
    // 248px width (--sidebar-width) - clicking near (0,0) lands on the
    // sidebar itself, which visually overlaps the scrim there and swallows
    // the click before it reaches the scrim underneath.
    const viewport = page.viewportSize();
    await page.mouse.click(viewport.width - 10, 10);
    await expect(nav).not.toBeInViewport();
  });

  test('mobile: DataTable renders as cards, not a horizontally-scrolling table', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only layout check');
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/catalogue');
    await settle(page);

    await expect(page.locator('.data-table thead')).toBeHidden();
    await expect(page.locator('.data-table tbody tr').first()).toBeVisible();
  });

  test('tablet: DataTable keeps its table layout (above the card-transform breakpoint)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet', 'Tablet-only layout check');
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/catalogue');
    await settle(page);

    await expect(page.locator('.data-table thead')).toBeVisible();
  });
});
