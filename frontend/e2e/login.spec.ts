// frontend/e2e/login.spec.ts
// Smoke test for the one shared login flow, plus an axe-core accessibility
// scan of the same page. This is the template for future page-level audits.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('login page renders and accepts seeded admin credentials', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'University Library' })).toBeVisible();

  await page.getByLabel('Email', { exact: true }).fill('admin@university.edu');
  await page.getByLabel('Password', { exact: true }).fill('Admin@1234');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin/);
});

test('login page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/login');
  // Let the card's entrance fade-in (framer-motion, ~200ms) fully settle before
  // scanning - axe measures whatever opacity is on screen at that instant, and a
  // still-transitioning opacity:0->1 produces spuriously low contrast readings
  // that have nothing to do with the page's real (settled) colors.
  await page.getByRole('heading', { name: 'University Library' }).waitFor({ state: 'visible' });
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
