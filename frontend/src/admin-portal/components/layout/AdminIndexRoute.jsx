// src/admin-portal/components/layout/AdminIndexRoute.jsx
// The index route (/admin) is the Dashboard for LIBRARIAN+, but Dashboard's
// analytics.* endpoints all 403 below that rank (see constants/nav.js) - a
// DESK_STAFF landing here would hit an ErrorState on every login. Send them
// to the first surface NAV_ITEMS says they can actually reach instead.
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { NAV_ITEMS } from '../../constants/nav';

export function AdminIndexRoute({ dashboard }) {
  const { user } = useAuthStore();

  if (rankAtLeast(user?.role, 'LIBRARIAN')) {
    return dashboard;
  }

  const firstAvailable = NAV_ITEMS.find((item) => item.key !== 'dashboard' && rankAtLeast(user?.role, item.minRole));
  return <Navigate to={firstAvailable?.path ?? '/admin'} replace />;
}
