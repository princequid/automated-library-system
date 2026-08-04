// src/admin-portal/components/common/Pagination.jsx
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

export function Pagination({ page, totalPages, onPageChange, totalItems, pageSize, className = '' }) {
  if (totalPages <= 1) return null;

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <nav className={`pagination ${className}`.trim()} aria-label="Pagination">
      <span className="pagination-summary">
        {totalItems === 0 ? 'No results' : `${start}–${end} of ${totalItems}`}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <span className="pagination-page" aria-current="page">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </nav>
  );
}
