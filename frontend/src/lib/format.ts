// frontend/src/lib/format.ts
// Shared formatting + the app-wide due-date urgency logic. Every view that shows a
// due date uses dueUrgency() so the green->amber->red scale is identical everywhere.
import { differenceInCalendarDays, format, isValid } from 'date-fns';

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return isValid(d) ? format(d, 'd MMM yyyy') : '—';
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return isValid(d) ? format(d, 'd MMM yyyy, HH:mm') : '—';
}

export function formatGhs(amount: number | string | null | undefined): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return `GHS ${(n || 0).toFixed(2)}`;
}

export type Urgency = 'ok' | 'soon' | 'overdue';

export interface DueInfo {
  urgency: Urgency;
  days: number; // negative = overdue by N days, positive = due in N days
  label: string;
  badgeVariant: 'success' | 'warning' | 'error';
}

/** One definition of due-date urgency for the whole app. */
export function dueUrgency(dueDate: string | Date): DueInfo {
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const days = differenceInCalendarDays(d, new Date());
  if (days < 0) {
    return { urgency: 'overdue', days, label: `${Math.abs(days)}d overdue`, badgeVariant: 'error' };
  }
  if (days <= 3) {
    return {
      urgency: 'soon',
      days,
      label: days === 0 ? 'Due today' : `Due in ${days}d`,
      badgeVariant: 'warning',
    };
  }
  return { urgency: 'ok', days, label: `Due in ${days}d`, badgeVariant: 'success' };
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
