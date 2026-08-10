// src/admin-portal/components/layout/AdminIndexRoute.jsx
// The index route (/admin) renders a genuinely different dashboard component
// per exact role - LIBRARIAN gets LibrarianDashboardPage ("Today's Library
// Operations"), ADMINISTRATOR gets AdministratorDashboardPage ("System &
// Library Oversight"). This is a role switch, not a rank cutoff - the two
// are deliberately different tools, not one dashboard with extra widgets.
import { useAuthStore } from '@/store/auth.store';

export function AdminIndexRoute({ librarianDashboard, administratorDashboard }) {
  const { user } = useAuthStore();
  return user?.role === 'ADMINISTRATOR' ? administratorDashboard : librarianDashboard;
}
