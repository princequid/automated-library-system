// src/admin-portal/components/layout/Navbar.jsx
import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from '../common/ThemeToggle';
import { NotificationBell } from '../common/NotificationBell';
import { MenuIcon } from '../common/Icons';

export function Navbar({ onOpenMobileNav }) {
  return (
    <header className="navbar">
      <button type="button" className="navbar-menu-btn" onClick={onOpenMobileNav} aria-label="Open navigation">
        <MenuIcon size={20} />
      </button>
      <Breadcrumbs />
      <div className="navbar-actions">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
