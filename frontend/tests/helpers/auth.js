/**
 * Session seeding for UI audits.
 *
 * Unlike the sibling FleetTrack project, this app's zustand auth store
 * (src/store/auth.store.ts) is NOT persisted to localStorage - the access
 * token lives in memory only, by design (a deliberate security choice: it
 * must not survive a page reload via storage). App.tsx therefore always
 * attempts a silent POST /auth/refresh on boot, using the httpOnly refresh
 * cookie, to re-establish a session.
 *
 * There is no localStorage key to poke directly here. Instead, seedSession()
 * stubs that refresh call to return a fake user + token, which is exactly the
 * boot-time flow the real app already runs - no app code changes needed, and
 * no separate "test-only" auth path to keep in sync with the real one.
 *
 * This is deliberately NOT a login-flow test - it bypasses the login form on
 * purpose so page shells can be audited without driving the real form. The
 * login flow itself (LoginPage.tsx) is covered by frontend/e2e/login.spec.ts
 * against the live API, separately.
 *
 * Exclusively owns **\/api/v1/auth/** - see api.js's header comment for why
 * that split avoids route-registration-order fragility between the two files.
 */

/** Roles the admin portal's route guards / nav branch on (see roles.js). */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SENIOR_LIBRARIAN: 'SENIOR_LIBRARIAN',
  LIBRARIAN: 'LIBRARIAN',
  DESK_STAFF: 'DESK_STAFF',
};

function userFor(role) {
  const names = {
    SUPER_ADMIN: 'UI Audit Super Admin',
    SENIOR_LIBRARIAN: 'UI Audit Senior Librarian',
    LIBRARIAN: 'UI Audit Librarian',
    DESK_STAFF: 'UI Audit Desk Staff',
  };
  return {
    id: `seed-${role.toLowerCase()}`,
    name: names[role] ?? 'UI Audit User',
    email: 'ui-audit@library.test',
    role,
    student_id: null,
    department: null,
  };
}

/**
 * Stubs a successful session for the given role. Call before `page.goto()` -
 * App.tsx fires the refresh call on its very first render, so registering the
 * route after navigation starts can lose the race.
 */
export async function seedSession(page, { role = ROLES.SUPER_ADMIN } = {}) {
  const user = userFor(role);
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { accessToken: 'ui-audit-token', user }, message: 'OK' }),
    })
  );
  await page.route('**/api/v1/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null, message: 'OK' }) })
  );
  return user;
}

/**
 * Waits for the app's boot-time session check to finish, so a spec doesn't
 * assert against App.tsx's full-page BrandLoader instead of the page underneath
 * it. Mirrors App.tsx's own `booting` state (see src/App.tsx).
 */
export async function settle(page) {
  await page.waitForLoadState('networkidle');
  // Two frames after idle: lets React flush the state update the refresh
  // response triggered, and lets any entrance transition finish its first
  // paint before contrast/layout is sampled.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
}
