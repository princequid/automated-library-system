// src/admin-portal/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuthStore, isAdminRole } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { useLogout } from '@/hooks/useAuth';
import { NAV_ITEMS } from '../../constants/nav';
import { LogoutIcon, CloseIcon } from '../common/Icons';

export function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const visibleItems = NAV_ITEMS.filter((item) => rankAtLeast(user?.role, item.minRole));

  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={onCloseMobile} aria-hidden="true" />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`.trim()}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">
            LB
          </span>
          <span className="sidebar-brand-name">Library Admin</span>
          <button type="button" className="sidebar-close" onClick={onCloseMobile} aria-label="Close navigation">
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`.trim()}
                onClick={onCloseMobile}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-avatar" aria-hidden="true">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{isAdminRole(user?.role) ? user?.role?.replace('_', ' ') : ''}</span>
            </div>
          </div>
          <button type="button" className="sidebar-logout" onClick={logout} aria-label="Log out">
            <LogoutIcon size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
