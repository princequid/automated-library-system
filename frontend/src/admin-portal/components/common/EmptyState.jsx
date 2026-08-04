// src/admin-portal/components/common/EmptyState.jsx
import { EmptyIcon } from './Icons';

/**
 * "No results for this filter" and "nothing here yet" are different
 * messages - pass `filtered` when the empty result is a consequence of the
 * current search/filter, not the true absence of data, so the user knows
 * clearing filters is the fix.
 */
export function EmptyState({ title, description, filtered = false, action, icon: Icon = EmptyIcon, className = '' }) {
  const resolvedTitle = title ?? (filtered ? 'No matching results' : 'Nothing here yet');
  const resolvedDescription =
    description ?? (filtered ? 'Try adjusting or clearing your filters.' : 'New records will appear here once added.');

  return (
    <div className={`empty-state ${className}`.trim()} role="status">
      <Icon size={40} className="empty-state-icon" aria-hidden="true" />
      <p className="empty-state-title">{resolvedTitle}</p>
      <p className="empty-state-description">{resolvedDescription}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
