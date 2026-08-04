// src/admin-portal/components/layout/DetailPageHeader.jsx
// Shared header for every row-detail page: a back link to the list, an
// entity icon, the row's own title/subtitle, an optional status badge, and
// page-level actions (Edit, Waive, etc). One shape so Catalogue/Members/
// Loans/Overdues/Staff detail pages all read the same way.
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '../common/Icons';

export function DetailPageHeader({ backTo, backLabel, icon, iconVariant = 'primary', title, subtitle, status, actions }) {
  return (
    <div className="detail-page-header">
      <Link to={backTo} className="detail-page-back">
        <ChevronLeftIcon size={16} /> {backLabel}
      </Link>
      <div className="detail-page-heading-row">
        <div className="detail-page-heading">
          {icon && <span className={`detail-page-icon detail-page-icon-${iconVariant}`}>{icon}</span>}
          <div className="detail-page-heading-text">
            <div className="detail-page-title-row">
              <h1 className="detail-page-title">{title}</h1>
              {status}
            </div>
            {subtitle && <p className="detail-page-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="detail-page-actions">{actions}</div>}
      </div>
    </div>
  );
}
