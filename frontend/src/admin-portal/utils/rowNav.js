// src/admin-portal/utils/rowNav.js
// `<tr onClick>` alone is a control nobody can reach by keyboard. This gives a
// clickable row real button semantics WITHOUT `role="button"` on the `<tr>`
// itself, which would destroy the table's row/cell semantics for a screen
// reader. Instead the row gets `tabIndex` + an Enter/Space handler + a visible
// focus ring (from the global :focus-visible rule in tokens.css), and stays a
// real `<tr>`.
export function rowNavProps(onActivate, { label } = {}) {
  return {
    tabIndex: 0,
    className: 'data-table-row-interactive',
    'aria-label': label,
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
