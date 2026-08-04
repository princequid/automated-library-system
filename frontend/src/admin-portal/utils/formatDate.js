// src/admin-portal/utils/formatDate.js
// Dates are for scanning. toLocaleString() gives "7/30/2026, 5:09:52 AM" - 22
// characters of the least scannable value in a table row. These give short,
// meaning-first text ("Due in 3 days" / "Overdue by 5 days" / "Today, 14:30"),
// with the full timestamp reserved for a `title` attribute on hover.

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function timeOfDay(d) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** Full, precise timestamp - only ever used as a `title` attribute, never as visible row text. */
export function fullTimestamp(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Relative, scannable text for an already-past event (issued date, created date, etc.). */
export function relativePast(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY_MS);
  if (days === 0) return `Today, ${timeOfDay(d)}`;
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Relative due-date text with an urgency bucket, so a Badge/colour can be
 * derived from the same single source of truth instead of a page re-deriving
 * "is this overdue" with its own off-by-one-prone date math.
 */
export function dueUrgency(value) {
  if (!value) return { label: '—', urgency: 'none', days: null };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { label: '—', urgency: 'none', days: null };
  const days = Math.round((startOfDay(d) - startOfDay(new Date())) / DAY_MS);

  if (days < 0) return { label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, urgency: 'overdue', days };
  if (days === 0) return { label: `Due today, ${timeOfDay(d)}`, urgency: 'due-today', days };
  if (days <= 3) return { label: `Due in ${days} day${days === 1 ? '' : 's'}`, urgency: 'due-soon', days };
  return { label: `Due in ${days} days`, urgency: 'ok', days };
}
