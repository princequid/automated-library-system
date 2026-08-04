// src/admin-portal/components/layout/AdminRouteGuard.jsx
// Per-surface role gate, layered inside the outer /admin RouteGuard (which
// only checks "is this any staff member"). Reads the same `minRole` the
// Sidebar uses to decide whether to render the link at all - see
// constants/nav.js's header comment for why that pairing matters. This is a
// UX safeguard only; the backend's RBAC on each endpoint is the real boundary.
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';

export function AdminRouteGuard({ minRole, children }) {
  const { user } = useAuthStore();

  if (!rankAtLeast(user?.role, minRole)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
