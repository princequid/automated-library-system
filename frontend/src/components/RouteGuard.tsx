// frontend/src/components/RouteGuard.tsx
// Client-side portal boundary. This is a UX safeguard only - the backend's RBAC is
// the real security boundary. Redirects unauthenticated users to /login, and sends
// a user who lands on the wrong portal to their correct one.
import { Navigate } from 'react-router-dom';
import { useAuthStore, isAdminRole } from '@/store/auth.store';

interface RouteGuardProps {
  requires: 'student' | 'admin';
  children: React.ReactNode;
}

export function RouteGuard({ requires, children }: RouteGuardProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userIsAdmin = isAdminRole(user.role);

  // Student trying to reach an admin route -> send to their portal, and vice versa.
  if (requires === 'admin' && !userIsAdmin) {
    return <Navigate to="/student" replace />;
  }
  if (requires === 'student' && userIsAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
