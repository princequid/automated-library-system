// frontend/src/layouts/StudentLayout.tsx
// Light top-bar shell for students. The active tab gets a sage underline that
// slides between tabs (Framer Motion layoutId) on route change. Collapses to a
// hamburger menu under 768px.
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, BookMarked, User, Menu, X, LogOut, Bell } from 'lucide-react';
import { Wordmark } from '@/components/Brand';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { useMyNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/api';
import { cn } from '@/lib/utils';

function NotificationBell() {
  const notifications = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = notifications.data ?? [];
  const unreadCount = items.filter((n) => !n.read_at).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-control p-2 text-text-secondary hover:bg-bg" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 && <p className="px-2 py-4 text-center text-sm text-text-secondary">No notifications yet.</p>}
        <div className="max-h-80 overflow-y-auto">
          {items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn('flex-col items-start gap-0.5 whitespace-normal py-2', !n.read_at && 'bg-primary/5')}
              onClick={() => !n.read_at && markRead.mutate(n.id)}
            >
              <span className="text-sm font-medium text-text-primary">{n.title}</span>
              <span className="text-xs text-text-secondary">{n.body}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NAV = [
  { to: '/student', label: 'Home', icon: Home, end: true },
  { to: '/student/search', label: 'Search', icon: Search, end: false },
  { to: '/student/loans', label: 'My loans', icon: BookMarked, end: false },
  { to: '/student/account', label: 'Account', icon: User, end: false },
];

export function StudentLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onSignOut = async () => {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  const isActive = (to: string, end: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4">
          <Wordmark />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = isActive(item.to, item.end);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={cn(
                    'relative px-3.5 py-2 text-sm font-medium transition-colors',
                    active ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="student-underline"
                      className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 hover:bg-bg">
                <Avatar name={user?.name ?? 'U'} />
                <span className="hidden text-sm text-text-primary sm:inline">{user?.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/student/account')}>
                  <User className="h-4 w-4" /> Account
                </DropdownMenuItem>
                <DropdownMenuItem destructive onClick={onSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              className="rounded-control p-2 text-text-secondary hover:bg-bg md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="border-t border-border bg-card px-4 py-2 md:hidden" aria-label="Mobile">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive: a }) =>
                  cn(
                    'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium',
                    a ? 'bg-primary-tint text-primary-hover' : 'text-text-secondary'
                  )
                }
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
