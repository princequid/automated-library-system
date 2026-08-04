// frontend/playwright.admin.config.js
// Separate from playwright.config.ts (which drives the untouched student
// portal's e2e/ specs) - Playwright errors on ambiguous precedence between
// two config files in one directory, so this one is named explicitly and
// every admin npm script passes --config=playwright.admin.config.js.
// Network is fully stubbed (tests/helpers/api.js) rather than hitting the
// real Express API, so these specs render deterministically off fixtures -
// see that file's header comment for why.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5183',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // Tablet at 834x1112 (iPad Air portrait) - the DataTable's card-transform
    // breakpoint sits at 767px, so tablet must stay ABOVE that to prove the
    // table layout (not the mobile card layout) survives the mid-size range.
    { name: 'tablet', use: { ...devices['iPad Air'], viewport: { width: 834, height: 1112 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5183',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
