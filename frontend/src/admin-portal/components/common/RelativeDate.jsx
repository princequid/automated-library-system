// src/admin-portal/components/common/RelativeDate.jsx
import { relativePast, fullTimestamp } from '../../utils/formatDate';

export function RelativeDate({ value, className = '' }) {
  if (!value) return <span className={className}>—</span>;
  return (
    <span className={className} title={fullTimestamp(value)}>
      {relativePast(value)}
    </span>
  );
}
