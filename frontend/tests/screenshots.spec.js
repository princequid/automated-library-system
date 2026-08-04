// frontend/tests/screenshots.spec.js
// Full-page PNGs for manual review - not toMatchSnapshot pixel diffing.
// "Passing" here just means the capture succeeded; the point is for a human
// to actually open these files (including the 390px/mobile set) before
// calling the rebuild done, per the plan's own verification checklist.
// Written to test-results/admin-screenshots/<project>/<theme>/<page>.png.
import { test } from '@playwright/test';
import path from 'node:path';
import { stubApi } from './helpers/api.js';
import { seedSession, settle, ROLES } from './helpers/auth.js';
import { seedTheme } from './helpers/theme.js';
import { ROUTES } from './helpers/routes.js';

const OUT_DIR = path.join('test-results', 'admin-screenshots');

for (const theme of ['light', 'dark']) {
  test.describe(`screenshots: ${theme}`, () => {
    for (const route of ROUTES) {
      test(`${route.key}`, async ({ page }, testInfo) => {
        await stubApi(page, { mode: 'populated' });
        await seedSession(page, { role: ROLES.SUPER_ADMIN });
        await seedTheme(page, theme);
        await page.goto(route.path);
        await settle(page);

        const file = path.join(OUT_DIR, testInfo.project.name, theme, `${route.key}.png`);
        await page.screenshot({ path: file, fullPage: true });
        await testInfo.attach(`${route.key}-${theme}`, { path: file, contentType: 'image/png' });
      });
    }
  });
}
