// src/admin-portal/utils/loanStatus.js
// The backend's Loan record has no literal `status` enum - it has
// `returned_at` (null = still out) and `due_date`. This is the one place that
// derives ACTIVE / OVERDUE / RETURNED from those two fields, so every page
// that shows a loan's status agrees with every other page and with Overdues'
// own filtering (which uses the same due_date-vs-now comparison).
export function deriveLoanStatus(loan) {
  if (loan.returned_at) return 'RETURNED';
  if (loan.due_date && new Date(loan.due_date) < new Date()) return 'OVERDUE';
  return 'ACTIVE';
}
