// src/admin-portal/components/common/RowActions.jsx
// Standard Actions-column pairing: a primary "View" text link (navigates to
// the row's detail page) plus an optional KebabMenu for secondary actions.
// Stops its own clicks from bubbling to the row so it never double-navigates
// when the row itself is also clickable.
import { KebabMenu } from './KebabMenu';

export function RowActions({ onView, menuItems, viewLabel = 'View' }) {
  return (
    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
      {onView && (
        <button type="button" className="row-actions-view" onClick={onView}>
          {viewLabel}
        </button>
      )}
      {menuItems && menuItems.length > 0 ? <KebabMenu items={menuItems} /> : <span className="row-actions-spacer" aria-hidden="true" />}
    </div>
  );
}
