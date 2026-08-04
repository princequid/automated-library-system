// src/admin-portal/components/common/DueDate.jsx
import { dueUrgency, fullTimestamp } from '../../utils/formatDate';

const URGENCY_CLASS = {
  overdue: 'due-date-overdue',
  'due-today': 'due-date-today',
  'due-soon': 'due-date-soon',
  ok: 'due-date-ok',
  none: '',
};

export function DueDate({ value, className = '' }) {
  const { label, urgency } = dueUrgency(value);
  return (
    <span className={`due-date ${URGENCY_CLASS[urgency]} ${className}`.trim()} title={fullTimestamp(value)}>
      {label}
    </span>
  );
}
