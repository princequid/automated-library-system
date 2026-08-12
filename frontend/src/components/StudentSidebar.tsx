// frontend/src/components/StudentSidebar.tsx
// Fixed left sidebar for the student portal, mirroring the admin-portal's
// Sidebar.jsx shape (deep-navy surface, rounded-pill active state, avatar +
// sign-out footer) so both portals read as one design language. Mobile:
// off-canvas drawer via a translate-x transform, toggled by the parent
// (StudentLayout) - same open/close-callback pattern as the admin sidebar.
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, BookMarked, User, LogOut, X, BookOpen } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/student', label: 'Home', icon: Home, end: true },
  { to: '/student/search', label: 'Search', icon: Search, end: false },
  { to: '/student/loans', label: 'My loans', icon: BookMarked, end: false },
  { to: '/student/account', label: 'Account', icon: User, end: false },
];

export function StudentSidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col bg-sidebar transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary text-inverse" aria-hidden>
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="font-serif text-base text-sidebar-text-active">University Library</span>
          <button
            type="button"
            className="ml-auto text-sidebar-text hover:text-sidebar-text-active md:hidden"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-hover text-sidebar-text-active before:absolute before:left-[-4px] before:top-[6px] before:bottom-[6px] before:w-[3px] before:rounded-full before:bg-accent'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                )
              }
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-sidebar-border p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={user?.name ?? 'U'} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-text-active">{user?.name}</p>
              <p className="truncate text-xs text-sidebar-text">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-control p-2 text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
            onClick={onSignOut}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
