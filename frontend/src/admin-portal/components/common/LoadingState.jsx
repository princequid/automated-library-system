// src/admin-portal/components/common/LoadingState.jsx
import { SpinnerIcon } from './Icons';

/** Generic loading placeholder for non-table surfaces (DataTable uses its own skeleton rows). */
export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div className={`loading-state ${className}`.trim()} role="status" aria-live="polite">
      <SpinnerIcon size={24} className="loading-state-spinner" />
      <span className="loading-state-label">{label}</span>
    </div>
  );
}

/** Row of skeleton blocks, e.g. for KPI strips while dashboard-stats resolves. */
export function SkeletonBlock({ width = '100%', height = '1em', className = '' }) {
  return <span className={`skeleton-block ${className}`.trim()} style={{ width, height }} aria-hidden="true" />;
}
