/**
 * Mirrors src/admin-portal/constants/nav.js's path/minRole pairs as plain
 * data, so specs can iterate role -> visible routes without importing JSX
 * (which needs a bundler) into the Node-side test helpers. Keep in sync with
 * nav.js by hand - there are only 8 rows.
 */
export const ROUTES = [
  { key: 'dashboard', path: '/admin', label: 'Dashboard', minRole: 'LIBRARIAN' },
  { key: 'catalogue', path: '/admin/catalogue', label: 'Catalogue', minRole: 'DESK_STAFF' },
  { key: 'members', path: '/admin/members', label: 'Members', minRole: 'LIBRARIAN' },
  { key: 'loans', path: '/admin/loans', label: 'Loans', minRole: 'DESK_STAFF' },
  { key: 'circulation', path: '/admin/circulation', label: 'Circulation', minRole: 'DESK_STAFF' },
  { key: 'overdues', path: '/admin/overdues', label: 'Overdues', minRole: 'LIBRARIAN' },
  { key: 'reports', path: '/admin/reports', label: 'Reports', minRole: 'LIBRARIAN' },
  { key: 'staff', path: '/admin/staff', label: 'Staff', minRole: 'SUPER_ADMIN' },
];

const RANK = { STUDENT: 0, DESK_STAFF: 1, LIBRARIAN: 2, SENIOR_LIBRARIAN: 3, SUPER_ADMIN: 4 };

export function rankAtLeast(role, minimum) {
  return RANK[role] >= RANK[minimum];
}

export function routesFor(role) {
  return ROUTES.filter((r) => rankAtLeast(role, r.minRole));
}
