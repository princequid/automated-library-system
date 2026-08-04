// src/admin-portal/utils/focusFirstError.js
// On a failed submit, move focus to the first invalid field so keyboard and
// screen-reader users land on the problem instead of a silently-updated
// error list they'd have to hunt for.
export function focusFirstError(formEl) {
  if (!formEl) return;
  const firstInvalid = formEl.querySelector('[aria-invalid="true"]');
  firstInvalid?.focus();
}
