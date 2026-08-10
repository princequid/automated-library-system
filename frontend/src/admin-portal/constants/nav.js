// src/admin-portal/constants/nav.js
// Single source of truth for admin navigation - the Sidebar filters this list
// to build visible links (grouped by `section`), and AdminRouteGuard reads
// the same `minRole` to gate the matching route, so nav visibility and route
// access can never drift apart. `minRole` is one of the backend's real roles
// (see src/lib/roles.ts's ORDER: STUDENT < LIBRARIAN < ADMINISTRATOR), read
// directly off each surface's actual endpoint gate (verified against
// backend/src/modules/*/*.routes.ts):
//   - Dashboard: LIBRARIAN+ (role-specific content - see AdminIndexRoute,
//     which picks LibrarianDashboardPage vs AdministratorDashboardPage).
//   - Catalogue/Loans/Circulation/Members/Overdues/Reports: LIBRARIAN+ (both
//     roles can view; write access differs inside the page - e.g. GET
//     /catalog/items is open, but a catalog item's force-delete is
//     Administrator-only via the override path).
//   - Reservations/Maintenance/Inventory/Acquisitions: LIBRARIAN+ to view,
//     but mutating actions inside these pages are LIBRARIAN-only
//     (requireRole('LIBRARIAN') exact on the backend - Administrator has
//     view-only access, no override path, per the spec's flat "View" cells).
//   - Staff: ADMINISTRATOR only (matches POST /users's gate exactly - this
//     is the one page an ADMINISTRATOR-only `section` reflects fully).
//   - Settings/Catalog Data: LIBRARIAN+ to view, write is ADMINISTRATOR-only.
//   - Audit Log: LIBRARIAN+ (LIBRARIAN sees only their own actions server-
//     side; ADMINISTRATOR sees everything - see auditLog.service.ts).
//
// `section` groups the sidebar into labelled blocks so the two roles' navs
// read as different tools, not one list with a rank cutoff - "Library
// Operations" is what a Librarian's day revolves around; "Administration" is
// governance surface. Both groups render for either role that can reach at
// least one item in it (a Librarian who opens Settings just can't save it).
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

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', end: true, icon: DashboardIcon, minRole: 'LIBRARIAN', section: 'Overview' },

  { key: 'circulation', label: 'Circulation', path: '/admin/circulation', icon: CirculationIcon, minRole: 'LIBRARIAN', section: 'Library Operations' },
  { key: 'loans', label: 'Loans', path: '/admin/loans', icon: LoansIcon, minRole: 'LIBRARIAN', section: 'Library Operations' },
  { key: 'overdues', label: 'Overdues', path: '/admin/overdues', icon: OverduesIcon, minRole: 'LIBRARIAN', section: 'Library Operations' },
  { key: 'reservations', label: 'Reservations', path: '/admin/reservations', icon: ReservationsIcon, minRole: 'LIBRARIAN', section: 'Library Operations' },
  { key: 'catalogue', label: 'Catalogue', path: '/admin/catalogue', icon: CatalogueIcon, minRole: 'LIBRARIAN', section: 'Library Operations' },
  { key: 'maintenance', label: 'Maintenance', path: '/admin/maintenance', icon: MaintenanceIcon, minRole: 'LIBRARIAN', section: 'Library Operations' },
  { key: 'inventory', label: 'Inventory', path: '/admin/inventory', icon: InventoryIcon, minRole: 'LIBRARIAN', section: 'Library Operations' },
  { key: 'acquisitions', label: 'Acquisitions', path: '/admin/acquisitions', icon: AcquisitionsIcon, minRole: 'LIBRARIAN', section: 'Library Operations' },

  { key: 'members', label: 'Members', path: '/admin/members', icon: MembersIcon, minRole: 'LIBRARIAN', section: 'Administration' },
  { key: 'staff', label: 'Staff', path: '/admin/staff', icon: StaffIcon, minRole: 'ADMINISTRATOR', section: 'Administration' },
  { key: 'catalog-data', label: 'Catalog Data', path: '/admin/catalog-data', icon: CatalogDataIcon, minRole: 'LIBRARIAN', section: 'Administration' },
  { key: 'settings', label: 'Settings', path: '/admin/settings', icon: SettingsIcon, minRole: 'LIBRARIAN', section: 'Administration' },
  { key: 'reports', label: 'Reports', path: '/admin/reports', icon: ReportsIcon, minRole: 'LIBRARIAN', section: 'Administration' },
  { key: 'audit-log', label: 'Audit Log', path: '/admin/audit-log', icon: AuditLogIcon, minRole: 'LIBRARIAN', section: 'Administration' },
];
