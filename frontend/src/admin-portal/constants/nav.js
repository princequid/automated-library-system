// src/admin-portal/constants/nav.js
// Single source of truth for admin navigation - the Sidebar filters this list
// to build visible links, and AdminRouteGuard reads the same `minRole` to
// gate the matching route, so nav visibility and route access can never
// drift apart. `minRole` is one of the backend's real roles (see
// src/lib/roles.ts's ORDER), read directly off each surface's actual
// endpoint gate (verified against backend/src/modules/*/*.routes.ts) rather
// than the request's LIBRARIAN/ADMIN/SUPER_ADMIN UI-tier language, which
// doesn't map 1:1:
//   - Catalogue (browse)/Loans/Circulation: DESK_STAFF+ (front-desk floor)
//   - Dashboard/Members/Overdues/Reports: LIBRARIAN+ (every analytics.*
//     endpoint and GET /users itself require LIBRARIAN+ - a DESK_STAFF nav
//     link here would 403 on load, not just on a mutating action)
//   - Staff: SUPER_ADMIN only (matches the backend's POST /users gate)
import {
  DashboardIcon,
  CatalogueIcon,
  MembersIcon,
  LoansIcon,
  CirculationIcon,
  OverduesIcon,
  ReportsIcon,
  StaffIcon,
} from '../components/common/Icons';

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', end: true, icon: DashboardIcon, minRole: 'LIBRARIAN' },
  { key: 'catalogue', label: 'Catalogue', path: '/admin/catalogue', icon: CatalogueIcon, minRole: 'DESK_STAFF' },
  { key: 'members', label: 'Members', path: '/admin/members', icon: MembersIcon, minRole: 'LIBRARIAN' },
  { key: 'loans', label: 'Loans', path: '/admin/loans', icon: LoansIcon, minRole: 'DESK_STAFF' },
  { key: 'circulation', label: 'Circulation', path: '/admin/circulation', icon: CirculationIcon, minRole: 'DESK_STAFF' },
  { key: 'overdues', label: 'Overdues', path: '/admin/overdues', icon: OverduesIcon, minRole: 'LIBRARIAN' },
  { key: 'reports', label: 'Reports', path: '/admin/reports', icon: ReportsIcon, minRole: 'LIBRARIAN' },
  { key: 'staff', label: 'Staff', path: '/admin/staff', icon: StaffIcon, minRole: 'SUPER_ADMIN' },
];
