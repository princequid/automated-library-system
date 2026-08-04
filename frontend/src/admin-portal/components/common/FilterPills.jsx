// src/admin-portal/components/common/FilterPills.jsx
// Status filter tabs with real counts, e.g. "All 13", "Overdue 3" - options
// come from the page (each with a real count derived from loaded/queried
// data, never a guessed number). Rendered as a real tab list, not plain
// buttons, since only one is ever "selected" at a time.
export function FilterPills({ options, active, onChange, className = '' }) {
  return (
    <div className={`filter-pills ${className}`.trim()} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="tab"
          aria-selected={active === opt.key}
          className={`filter-pill ${active === opt.key ? 'is-active' : ''}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
          {typeof opt.count === 'number' && <span className="filter-pill-count">{opt.count}</span>}
        </button>
      ))}
    </div>
  );
}
