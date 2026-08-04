// src/admin-portal/components/common/LiveBadge.jsx
// Only ever pass a `seconds` value that actually matches a real
// refetchInterval on the queries feeding the page - this badge is a claim
// ("this view refreshes itself"), not decoration, so it must stay true.
export function LiveBadge({ seconds, className = '' }) {
  return (
    <span className={`live-badge ${className}`.trim()}>
      <span className="live-badge-dot" aria-hidden="true" />
      Live · {seconds}s
    </span>
  );
}
