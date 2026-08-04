// src/admin-portal/components/common/DetailSection.jsx
// A titled card of key:value fields for a detail page - the "full row,
// uncramped" counterpart to a DataTable's truncated columns. DetailField's
// value can be any node (a Badge, a RelativeDate, plain text).
export function DetailSection({ title, icon, iconVariant = 'primary', children, className = '' }) {
  return (
    <section className={`detail-section ${className}`.trim()}>
      {title && (
        <div className="detail-section-header">
          {icon && <span className={`detail-section-icon detail-section-icon-${iconVariant}`}>{icon}</span>}
          <h2 className="detail-section-title">{title}</h2>
        </div>
      )}
      <div className="detail-field-grid">{children}</div>
    </section>
  );
}

export function DetailField({ label, value, span }) {
  const isEmpty = value === undefined || value === null;
  return (
    <div className={`detail-field ${span ? 'detail-field-span-2' : ''}`.trim()}>
      <span className="detail-field-label">{label}</span>
      <span className={`detail-field-value ${isEmpty ? 'detail-field-value-empty' : ''}`.trim()}>{isEmpty ? '—' : value}</span>
    </div>
  );
}
