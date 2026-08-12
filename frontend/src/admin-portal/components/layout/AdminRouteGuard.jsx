// src/admin-portal/components/layout/AdminRouteGuard.jsx
// Per-surface role gate, layered inside the outer /admin RouteGuard (which
// only checks "is this any staff member"). Reads the same `roles` allow-list
// the Sidebar uses to decide whether to render the link at all - see
// constants/nav.js's header comment for why that pairing matters and why
// it's an exact allow-list rather than a rank cutoff (Administrator does not
// automatically see Library Operations pages just by outranking Librarian).
// This is a UX safeguard only; the backend's RBAC on each endpoint is the
// real boundary.
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export function AdminRouteGuard({ roles, children }) {
  const { user } = useAuthStore();

  if (!roles.includes(user?.role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
