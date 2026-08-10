// src/admin-portal/components/common/QuickActions.jsx
// A labelled grid of shortcut links, used by the Librarian and Administrator
// dashboards to surface each role's own primary actions (spec section 22:
// Librarian's "Issue Book/Return Book/..." vs Administrator's "Manage
// Users/Manage Roles/..." - two different action sets, not one list with a
// rank cutoff).
import { Link } from 'react-router-dom';

export function QuickActions({ title, items }) {
  return (
    <section className="quick-actions">
      {title && <h2 className="quick-actions-title">{title}</h2>}
      <div className="quick-actions-grid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.to} className="quick-action-card">
              <span className="quick-action-icon">
                <Icon size={18} />
              </span>
              <span className="quick-action-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
