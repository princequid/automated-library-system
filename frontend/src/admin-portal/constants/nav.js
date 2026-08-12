// src/admin-portal/constants/nav.js
// Single source of truth for admin navigation - the Sidebar filters this list
// to build visible links (grouped by `section`, or `sectionByRole[role]` when
// an item's heading differs per role), and AdminRouteGuard reads the same
// `roles` to gate the matching route, so nav visibility and route access can
// never drift apart. `roles` is an EXACT allow-list (not a rank cutoff) -
// Administrator does not automatically inherit Librarian's items just by
// outranking them, because the two roles are meant to see different tools,
// not one list with extra items unlocked at the top.
//
//   - Dashboard: LIBRARIAN + ADMINISTRATOR (role-specific content - see
//     AdminIndexRoute, which picks LibrarianDashboardPage vs
//     AdministratorDashboardPage - same nav link, different page per role).
//   - Circulation/Loans/Overdues/Reservations/Catalogue/Maintenance/
//     Inventory: LIBRARIAN only, under "Library Operations". Administrator
//     has NO nav or route access to this section at all - the backend's
//     requireLibrarianOrOverride() still lets Administrator act on
//     circulation/fines/force-delete as an audited, exceptional path (see
//     middleware/rbac.ts), but deliberately has no UI surface here.
//   - Members/Acquisitions/Catalog Data: LIBRARIAN + ADMINISTRATOR - both use
//     these day-to-day (front-desk lookups, requesting/receiving books,
//     picking a category while cataloguing), so they're NOT filed under
//     "Administration" for a Librarian - `sectionByRole` puts them under
//     "Library Operations" for LIBRARIAN and "Administration" for
//     ADMINISTRATOR. Same page, same route, different heading per viewer.
//   - Staff/Reports/Audit Log/Settings: ADMINISTRATOR only - genuinely
//     governance-only surfaces. A Librarian has no nav or route access to
//     these at all ("no administration functionality for the Librarian");
//     the backend endpoints behind Reports/Audit-Log/Settings still answer
//     LIBRARIAN+ where they always did (e.g. a Librarian's own dashboard
//     still reads analytics endpoints directly) - only the dedicated admin
//     pages for browsing them are hidden.
//
// The net effect: a Librarian's sidebar never shows the word
// "Administration" at all; an Administrator's sidebar never shows "Library
// Operations" at all.
import {
  DashboardIcon,
  CatalogueIcon,
  MembersIcon,
  LoansIcon,
  CirculationIcon,
  OverduesIcon,
  ReportsIcon,
  StaffIcon,
  ReservationsIcon,
  MaintenanceIcon,
  InventoryIcon,
  AcquisitionsIcon,
  CatalogDataIcon,
  SettingsIcon,
  AuditLogIcon,
} from '../components/common/Icons';

const LIBRARIAN = 'LIBRARIAN';
const ADMINISTRATOR = 'ADMINISTRATOR';

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', end: true, icon: DashboardIcon, roles: [LIBRARIAN, ADMINISTRATOR], section: 'Overview' },

  { key: 'circulation', label: 'Circulation', path: '/admin/circulation', icon: CirculationIcon, roles: [LIBRARIAN], section: 'Library Operations' },
  { key: 'loans', label: 'Loans', path: '/admin/loans', icon: LoansIcon, roles: [LIBRARIAN], section: 'Library Operations' },
  { key: 'overdues', label: 'Overdues', path: '/admin/overdues', icon: OverduesIcon, roles: [LIBRARIAN], section: 'Library Operations' },
  { key: 'reservations', label: 'Reservations', path: '/admin/reservations', icon: ReservationsIcon, roles: [LIBRARIAN], section: 'Library Operations' },
  { key: 'catalogue', label: 'Catalogue', path: '/admin/catalogue', icon: CatalogueIcon, roles: [LIBRARIAN], section: 'Library Operations' },
  { key: 'maintenance', label: 'Maintenance', path: '/admin/maintenance', icon: MaintenanceIcon, roles: [LIBRARIAN], section: 'Library Operations' },
  { key: 'inventory', label: 'Inventory', path: '/admin/inventory', icon: InventoryIcon, roles: [LIBRARIAN], section: 'Library Operations' },

  {
    key: 'members',
    label: 'Members',
    path: '/admin/members',
    icon: MembersIcon,
    roles: [LIBRARIAN, ADMINISTRATOR],
    section: 'Administration',
    sectionByRole: { LIBRARIAN: 'Library Operations' },
  },
  {
    key: 'acquisitions',
    label: 'Acquisitions',
    path: '/admin/acquisitions',
    icon: AcquisitionsIcon,
    roles: [LIBRARIAN, ADMINISTRATOR],
    section: 'Administration',
    sectionByRole: { LIBRARIAN: 'Library Operations' },
  },
  {
    key: 'catalog-data',
    label: 'Catalog Data',
    path: '/admin/catalog-data',
    icon: CatalogDataIcon,
    roles: [LIBRARIAN, ADMINISTRATOR],
    section: 'Administration',
    sectionByRole: { LIBRARIAN: 'Library Operations' },
  },

  { key: 'staff', label: 'Staff', path: '/admin/staff', icon: StaffIcon, roles: [ADMINISTRATOR], section: 'Administration' },
  { key: 'reports', label: 'Reports', path: '/admin/reports', icon: ReportsIcon, roles: [ADMINISTRATOR], section: 'Administration' },
  { key: 'audit-log', label: 'Audit Log', path: '/admin/audit-log', icon: AuditLogIcon, roles: [ADMINISTRATOR], section: 'Administration' },
  // Kept last in the whole list, not just its section - a deliberate "furthest
  // from daily work" placement per user feedback.
  { key: 'settings', label: 'Settings', path: '/admin/settings', icon: SettingsIcon, roles: [ADMINISTRATOR], section: 'Administration' },
];
