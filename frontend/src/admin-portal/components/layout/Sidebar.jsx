// src/admin-portal/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuthStore, isAdminRole } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { NAV_ITEMS } from '../../constants/nav';
import { LogoutIcon, CloseIcon } from '../common/Icons';

// Grouped by each item's resolved section (in first-seen order) rather than
// one flat list - a Librarian and an Administrator looking at the sidebar
// should see it organized around different concerns ("Library Operations"
// vs "Administration"), not just a longer/shorter version of one list. A few
// items (Members/Acquisitions/Catalog Data) are shared by both roles but
// filed under a different heading per viewer via `sectionByRole` - see
// constants/nav.js's header comment for the exact per-item gating.
function groupBySection(items, role) {
  const groups = [];
  for (const item of items) {
    const section = item.sectionByRole?.[role] ?? item.section;
    let group = groups.find((g) => g.section === section);
    if (!group) {
      group = { section, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

// The two roles are separate portals now, not one "admin" shell wearing
// different hats - the brand text says which one you're actually in.
const PORTAL_NAME = { LIBRARIAN: 'Librarian', ADMINISTRATOR: 'Administrator' };

export function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const groups = groupBySection(visibleItems, user?.role);

  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={onCloseMobile} aria-hidden="true" />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`.trim()}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">
            LB
          </span>
          <span className="sidebar-brand-name">{PORTAL_NAME[user?.role] ?? 'Library'}</span>
          <button type="button" className="sidebar-close" onClick={onCloseMobile} aria-label="Close navigation">
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {groups.map((group) => (
            <div key={group.section} className="sidebar-section">
              {group.section && <span className="sidebar-section-label">{group.section}</span>}
              {group.items.map((item) => {
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
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-avatar" aria-hidden="true">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{isAdminRole(user?.role) ? user?.role : ''}</span>
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
