// src/admin-portal/components/layout/Navbar.jsx
import { useAuthStore } from '@/store/auth.store';
import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from '../common/ThemeToggle';
import { NotificationBell } from '../common/NotificationBell';
import { Avatar } from '../common/Avatar';
import { MenuIcon } from '../common/Icons';
import { greetingLine } from '../../utils/greeting';

// The greeting used to live inside each page's own PageHeader (so only the
// Dashboard had one) - it's here now so it appears on every page, matching
// the reference design's persistent "Welcome back, [Name]" top strip. The
// two dashboard pages no longer set their own greeting in PageHeader's
// description to avoid showing it twice.
export function Navbar({ onOpenMobileNav }) {
  const { user } = useAuthStore();

  return (
    <header className="navbar">
      <button type="button" className="navbar-menu-btn" onClick={onOpenMobileNav} aria-label="Open navigation">
        <MenuIcon size={20} />
      </button>
      <div className="navbar-greeting">
        <span className="navbar-greeting-text">{greetingLine(user?.name)}</span>
        <Breadcrumbs />
      </div>
      <div className="navbar-actions">
        <NotificationBell />
        <ThemeToggle />
        <Avatar name={user?.name} size="sm" />
      </div>
    </header>
  );
}
