// src/admin-portal/components/common/Badge.jsx
// A STATE indicator (Active / Returned / Overdue / Lost, Active / Suspended /
// Graduated). Never used for a MAGNITUDE (overdue severity) - that's
// SeverityMeter, a deliberately different shape, so the two scales can never
// be confused for each other. Colour is never the only signal: every variant
// pairs a small dot with the text label.
const DOT_CLASS = {
  success: 'badge-dot-success',
  warning: 'badge-dot-warning',
  danger: 'badge-dot-danger',
  info: 'badge-dot-info',
  teal: 'badge-dot-teal',
  neutral: 'badge-dot-neutral',
};

export function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      <span className={`badge-dot ${DOT_CLASS[variant]}`} aria-hidden="true" />
      {children}
    </span>
  );
}

const LOAN_STATUS_VARIANT = { ACTIVE: 'info', RETURNED: 'neutral', OVERDUE: 'danger', LOST: 'warning' };
export function LoanStatusBadge({ status }) {
  return <Badge variant={LOAN_STATUS_VARIANT[status] ?? 'neutral'}>{status}</Badge>;
}

const MEMBER_STATUS_VARIANT = { ACTIVE: 'success', SUSPENDED: 'danger', GRADUATED: 'neutral', DELETED: 'neutral' };
export function MemberStatusBadge({ status }) {
  return <Badge variant={MEMBER_STATUS_VARIANT[status] ?? 'neutral'}>{status}</Badge>;
}

const COPY_STATUS_VARIANT = { AVAILABLE: 'success', ON_LOAN: 'info', RESERVED: 'warning', DAMAGED: 'danger', LOST: 'danger', WITHDRAWN: 'neutral' };
export function CopyStatusBadge({ status }) {
  return <Badge variant={COPY_STATUS_VARIANT[status] ?? 'neutral'}>{status.replace('_', ' ')}</Badge>;
}
