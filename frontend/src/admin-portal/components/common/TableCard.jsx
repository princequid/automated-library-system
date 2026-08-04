// src/admin-portal/components/common/TableCard.jsx
// Card chrome around a DataTable: title, optional description, a slot for
// filters/search on the right, and the table itself. Kept separate from
// DataTable so pages can compose non-table content (e.g. bulk-action bars)
// between the header and the table body.
export function TableCard({ title, description, actions, children, className = '' }) {
  return (
    <section className={`table-card ${className}`.trim()}>
      {(title || actions) && (
        <header className="table-card-header">
          <div className="table-card-heading">
            {title && <h2 className="table-card-title">{title}</h2>}
            {description && <p className="table-card-description">{description}</p>}
          </div>
          {actions && <div className="table-card-actions">{actions}</div>}
        </header>
      )}
      <div className="table-card-body">{children}</div>
    </section>
  );
}
