// frontend/tests/interactions.spec.js
// The other suites prove pages render and pass a11y/data checks; this one
// actually drives the interactive flows end to end (fill a form and submit,
// walk the 3-step Issue picker, run a real bulk-waive, change a status) -
// none of that is exercised just by opening a modal and auditing it.
import { test, expect } from '@playwright/test';
import { stubApi } from './helpers/api.js';
import { seedSession, settle, ROLES } from './helpers/auth.js';
import * as lib from './helpers/library-data.js';

test.describe('interactions', () => {
  test('Catalogue: Add item form submits and closes', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/catalogue');
    await settle(page);

    await page.getByRole('button', { name: 'Add item' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Title').fill('A New Testing Title');
    await dialog.getByLabel('Author').fill('Test Author');
    await dialog.getByRole('button', { name: 'Add item' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('Item added to the catalogue.')).toBeVisible();
  });

  test('Catalogue: Add item form blocks submit and shows errors when required fields are empty', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/catalogue');
    await settle(page);

    await page.getByRole('button', { name: 'Add item' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Add item' }).click();

    await expect(dialog.getByText('Title is required.')).toBeVisible();
    await expect(dialog.getByText('Author is required.')).toBeVisible();
    // Still open - a validation failure must never silently "succeed".
    await expect(dialog).toBeVisible();
  });

  test('Circulation: full issue flow (title -> copy -> borrower -> issue)', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/circulation');
    await settle(page);

    const issuePanel = page.locator('.table-card', { hasText: 'Issue a book' });

    await issuePanel.getByPlaceholder('Search by title or author…').fill('Algorithms');
    await issuePanel.getByRole('button', { name: /Introduction to Algorithms/ }).click();

    // Step 2: an AVAILABLE copy button becomes selectable once copies load.
    const firstCopy = issuePanel.locator('.circulation-step', { hasText: 'Copy' }).locator('.circulation-result-list button').first();
    await expect(firstCopy).toBeVisible();
    await firstCopy.click();
    await expect(firstCopy).toHaveClass(/is-selected/);

    await issuePanel.getByPlaceholder('Search name, email, or ID…').fill('Ama');
    await issuePanel.getByRole('button', { name: /Ama Mensah/ }).click();

    const issueButton = issuePanel.getByRole('button', { name: 'Issue book' });
    await expect(issueButton).toBeEnabled();
    await issueButton.click();

    await expect(page.getByText(/^Issued /)).toBeVisible();
  });

  test('Circulation: return by barcode succeeds', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/circulation');
    await settle(page);

    const returnPanel = page.locator('.table-card', { hasText: 'Return a book' });
    await returnPanel.getByPlaceholder('Barcode').fill('LIB-001');
    await returnPanel.getByRole('button', { name: 'Return' }).click();

    await expect(page.getByText(/^Returned/)).toBeVisible();
  });

  test('Overdues: bulk-waive runs to completion and reports success', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/overdues');
    await settle(page);

    // FinesCard defaults to the "Unresolved" filter pill (see FinesCard.jsx),
    // so the visible rows are already unpaid+un-waived without changing it.
    const finesCard = page.locator('.table-card', { hasText: 'Fines' });
    const checkboxes = finesCard.locator('tbody input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await page.getByRole('button', { name: 'Waive 2 selected' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('input[placeholder="Reason (required)"]').fill('Goodwill waiver - test');
    await dialog.getByRole('button', { name: 'Waive all' }).click();

    await expect(dialog.getByText('All 2 fines waived.')).toBeVisible();
    // exact: true - the modal's own "×" close button has aria-label "Close
    // dialog", which also matches a substring search for "Close".
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog).toBeHidden();
  });

  test('Members: status change requires a reason and reflects the new status', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/members');
    await settle(page);

    // Row click now navigates to a full detail page (MemberDetailPage) with
    // the row passed via router state, not a modal.
    await page.getByText(lib.members[0].name).click();
    await expect(page).toHaveURL(/\/admin\/members\/mem-1$/);
    await expect(page.getByRole('heading', { name: lib.members[0].name, level: 1 })).toBeVisible();

    const statusSection = page.locator('.detail-section', { hasText: 'Change status' });
    const applyButton = statusSection.getByRole('button', { name: 'Apply' });
    await statusSection.locator('.select').selectOption('SUSPENDED');
    // No reason yet - Apply must stay disabled rather than allow a silent no-reason change.
    await expect(applyButton).toBeDisabled();

    await statusSection.getByPlaceholder('Reason (required)').fill('Overdue items not returned');
    await expect(applyButton).toBeEnabled();
    await applyButton.click();

    await expect(page.getByText('Status updated.')).toBeVisible();
  });

  test('Staff: create account shows the one-time temp password', async ({ page }) => {
    await stubApi(page, { mode: 'populated' });
    await seedSession(page, { role: ROLES.SUPER_ADMIN });
    await page.goto('/admin/staff');
    await settle(page);

    await page.getByRole('button', { name: 'Add staff' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill('New Desk Clerk');
    await dialog.getByLabel('Email').fill('new.clerk@university.edu');
    await dialog.getByRole('button', { name: 'Create account' }).click();

    await expect(dialog.getByText('Staff account created')).toBeVisible();
    await expect(dialog.locator('.member-created-password')).toBeVisible();
  });
});
