// frontend/src/layouts/StudentLayout.tsx
// Fixed left-sidebar shell for students (see StudentSidebar.tsx), mirroring
// the admin-portal's AppShell/Sidebar/Navbar shape. A slim top strip above
// the page content carries the greeting (moved up here from HomePage.tsx so
// it appears on every page, not just Home) and the notification bell.
import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Menu, Bell } from 'lucide-react';
import { StudentSidebar } from '@/components/StudentSidebar';
import { PageLoader } from '@/components/PageLoader';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { useMyNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/api';
import { greeting } from '@/lib/format';
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

export function StudentLayout() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="flex min-h-screen bg-bg">
      <StudentSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
          <button
            type="button"
            className="rounded-control p-2 text-text-secondary hover:bg-bg md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate font-serif text-base italic text-text-primary">
            {greeting()}, {firstName}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 md:px-8">
          <Suspense fallback={<PageLoader size="section" />}>
            {/* Keyed by pathname so each new page replays this fade-in on
                mount, rather than the swap from the loader (or from the
                previous page) landing as an instant pop-in. */}
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
