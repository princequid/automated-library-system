// src/admin-portal/components/layout/PageHeader.jsx
export function PageHeader({ title, description, actions, className = '' }) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header-heading">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
