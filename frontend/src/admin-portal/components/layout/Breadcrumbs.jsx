// src/admin-portal/components/layout/Breadcrumbs.jsx
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants/nav';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((item) => (item.end ? pathname === item.path : pathname.startsWith(item.path)));

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/admin">Admin</Link>
        </li>
        {current && current.path !== '/admin' && (
          <li aria-current="page">{current.label}</li>
        )}
        {current && current.path === '/admin' && <li aria-current="page">Dashboard</li>}
      </ol>
    </nav>
  );
}
