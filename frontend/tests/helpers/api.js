/**
 * Network-layer API stub for the admin portal UI suite.
 *
 * Three modes:
 *   "empty"     (default) — 200s with empty collections, so pages render their
 *                populated-but-empty state.
 *   "populated" — 200s with the library fixtures (tests/helpers/library-data.js),
 *                so table rows, badges, avatars and row actions actually render.
 *                This is not optional: a suite that only ever renders empty
 *                tables scans no table cells, so every badge/avatar/row-button
 *                passes by absence. On the sibling FleetTrack project, switching
 *                an already-green suite to populated fixtures surfaced 64
 *                serious contrast violations and 38 mouse-only table rows that
 *                had been invisible the whole time.
 *   "error"     — 500s, so pages render their ErrorState with retry, not a
 *                silent fallthrough to empty.
 *
 * The Express API is not started for these specs on purpose: with every
 * request intercepted, pages render deterministically off fixtures instead of
 * whatever happens to be in the dev database, and loading/empty/error states -
 * the surface most likely to be neglected - actually get exercised.
 *
 * Deliberately never touches `**\/api/v1/auth/**` - tests/helpers/auth.js owns
 * that exclusively, so seedSession() can be called before or after stubApi()
 * with no registration-order fragility between the two files (Playwright
 * matches routes in reverse-registration order, so two handlers both willing
 * to match the same URL would otherwise race on call order).
 */
import * as lib from './library-data.js';

// Everything this file handles - explicitly NOT auth, which belongs to auth.js.
// Every new module added in the checklist-gap-closure pass is included here
// too (notifications especially - NotificationBell polls on a refetchInterval
// from every admin page's Navbar, so leaving it unstubbed meant EVERY test in
// the suite silently leaked a real network request; with enough parallel
// tests that's exactly how it once rate-limited a real local backend and took
// an unrelated student-portal e2e test down with it).
const RESOURCE_PATTERN =
  '**/api/v1/{catalog,users,circulation,fines,analytics,notifications,maintenance,inventory,acquisitions,authors,publishers,categories,locations,audit-logs,settings}/**';

function envelope(data, meta) {
  return { success: true, data, message: 'OK', ...(meta ? { meta } : {}) };
}

function paginated(items, { page = 1, limit = 20 } = {}) {
  return envelope(items, { page, limit, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)) });
}

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ mode?: 'empty' | 'populated' | 'error' }} [options]
 */
export async function stubApi(page, { mode = 'empty' } = {}) {
  // Registered FIRST = lowest priority (Playwright tries the most-recently
  // registered matching handler first) - this is the fallback for any
  // resource path not given a specific handler below, so nothing hangs
  // waiting on a real request that will never resolve.
  await page.route(RESOURCE_PATTERN, (route) =>
    mode === 'error' ? fulfillJson(route, { success: false, error: 'Stubbed failure for UI audit' }, 500) : fulfillJson(route, envelope(null))
  );

  if (mode === 'error') return; // the fallback above already covers everything

  const empty = mode === 'empty';

  // Trailing `**` is required here, unlike reshelf/issue/return/renew below -
  // every real caller (CataloguePage, IssuePanel) sends page/limit/search
  // query params, and a pattern with no trailing `**` only matches the bare
  // path with nothing after it. Without it, these requests silently fall
  // through to the RESOURCE_PATTERN catch-all above and resolve to `data:
  // null` even in "populated" mode - exactly the kind of bug this harness
  // exists to catch, so it can't be allowed to hide in the harness itself.
  await page.route(`**/api/v1/catalog/items**`, (route) =>
    fulfillJson(route, paginated(empty ? [] : lib.catalogItems))
  );
  // Must be registered AFTER the list route above (Playwright tries the
  // most-recently registered matching handler first) so a request to the
  // single-item path (`/catalog/items/cat-1`, no further segment) doesn't
  // fall through to the list handler above and get `data: [...]` (an array)
  // instead of a single item object - CatalogueDetailPage reads `data.title`
  // etc. directly, so that mismatch silently rendered every field as blank.
  await page.route(/\/api\/v1\/catalog\/items\/[^/]+(\?.*)?$/, (route) => {
    if (empty) return fulfillJson(route, { success: false, error: 'Not found' }, 404);
    const id = new URL(route.request().url()).pathname.split('/').pop();
    const item = lib.catalogItems.find((i) => i.id === id);
    if (!item) return fulfillJson(route, { success: false, error: 'Not found' }, 404);
    return fulfillJson(route, envelope({ ...item, loan_period_days: 14, copies: lib.copies }));
  });
  await page.route(`**/api/v1/catalog/isbn-lookup**`, (route) => fulfillJson(route, envelope(null)));
  await page.route(`**/api/v1/catalog/items/*/copies**`, (route) => fulfillJson(route, envelope(empty ? [] : lib.copies)));
  await page.route(`**/api/v1/catalog/copies/**`, (route) => fulfillJson(route, envelope({ ok: true })));

  await page.route(`**/api/v1/users**`, (route) => {
    const method = route.request().method();
    // POST /users returns { user, tempPassword } (see
    // backend/src/modules/users/users.controller.ts's create) - a shape
    // MemberCreateModal/StaffCreateModal read directly (created.user.name).
    // Falling through to the paginated-list shape below for a POST, as an
    // earlier version of this stub did, crashes that render with
    // "Cannot read properties of undefined" the moment a real create flow
    // runs - a bug the harness only caught once interactions.spec.js
    // actually drove the flow instead of just opening the modal.
    if (method === 'POST') {
      const body = route.request().postDataJSON();
      return fulfillJson(
        route,
        envelope({ user: { id: 'user-new', ...body, status: 'ACTIVE' }, tempPassword: 'Tmp-9f3k2A' }),
        201
      );
    }
    // PUT /users/:id and /users/:id/status both return the single updated user.
    if (method === 'PUT') {
      return fulfillJson(route, envelope({ id: 'user-updated', ...route.request().postDataJSON() }));
    }

    const url = new URL(route.request().url());
    const role = url.searchParams.get('role');
    const pool = empty ? [] : role === 'STUDENT' ? lib.members : role ? lib.staff.filter((s) => s.role === role) : lib.staff;
    return fulfillJson(route, paginated(pool));
  });

  // Registered AFTER the generic /users** handler above so these three win
  // (Playwright = most-recently-registered wins) for /users/:id/loans,
  // /fines, /eligibility specifically. Without them those requests fall
  // through to the generic handler and get back a page of User objects
  // where a Loan/Fine/eligibility result was expected -
  // MemberDetailModal's `loan.copy.catalog_item.title` then crashes on a
  // real object that has no `.copy` at all. Caught only once
  // interactions.spec.js actually opened a member's detail view instead of
  // just asserting the page rendered.
  await page.route(`**/api/v1/users/*/loans**`, (route) => {
    const userId = route.request().url().match(/\/users\/([^/]+)\/loans/)?.[1];
    return fulfillJson(route, envelope(empty ? [] : lib.loans.filter((l) => l.user_id === userId)));
  });
  await page.route(`**/api/v1/users/*/fines**`, (route) => {
    const userId = route.request().url().match(/\/users\/([^/]+)\/fines/)?.[1];
    return fulfillJson(route, envelope(empty ? [] : lib.fines.filter((f) => f.user_id === userId)));
  });
  await page.route(`**/api/v1/users/*/eligibility**`, (route) =>
    fulfillJson(route, envelope({ eligible: true, active_loans: 1, loan_limit: 5, outstanding_fines: 0, blocking_threshold: 50 }))
  );

  await page.route(`**/api/v1/circulation/loans**`, (route) => {
    const url = new URL(route.request().url());
    const overdueOnly = url.searchParams.get('overdue') === 'true';
    const pool = empty ? [] : overdueOnly ? lib.overdueLoans : lib.loans;
    return fulfillJson(route, paginated(pool));
  });
  await page.route(`**/api/v1/circulation/reshelf`, (route) => fulfillJson(route, envelope(empty ? [] : lib.reshelfQueue)));
  await page.route(`**/api/v1/circulation/issue`, (route) => fulfillJson(route, envelope({ id: 'loan-new' })));
  await page.route(`**/api/v1/circulation/return`, (route) => fulfillJson(route, envelope({ ok: true })));
  await page.route(`**/api/v1/circulation/renew`, (route) => fulfillJson(route, envelope({ ok: true })));

  await page.route(`**/api/v1/fines**`, (route) => {
    if (route.request().method() !== 'GET') return fulfillJson(route, envelope({ ok: true }));
    return fulfillJson(route, paginated(empty ? [] : lib.fines));
  });

  await page.route(`**/api/v1/analytics/dashboard-stats`, (route) =>
    fulfillJson(route, envelope(empty ? { activeLoans: 0, overdueCount: 0, finesCollectedThisMonth: 0, itemsAddedThisWeek: 0 } : lib.dashboardStats))
  );
  await page.route(`**/api/v1/analytics/loan-volume**`, (route) => fulfillJson(route, envelope(empty ? [] : lib.loanVolume)));
  await page.route(`**/api/v1/analytics/overdue-rate**`, (route) => fulfillJson(route, envelope(empty ? [] : lib.overdueRate)));
  await page.route(`**/api/v1/analytics/top-borrowed**`, (route) => fulfillJson(route, envelope(empty ? [] : lib.topBorrowed)));
  await page.route(`**/api/v1/analytics/borrowing-by-dept`, (route) => fulfillJson(route, envelope(empty ? [] : lib.borrowingByDept)));
  await page.route(`**/api/v1/analytics/recent-activity`, (route) => fulfillJson(route, envelope(empty ? [] : lib.recentActivity)));
}
