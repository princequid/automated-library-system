// src/admin-portal/components/common/DataTable.jsx
// The one table component for the admin portal. Column shape:
//   {
//     key: string,                       // stable identity + used as data-label
//     header: string,
//     accessor?: (row) => value,         // raw value, used by default sort/render
//     render?: (row) => ReactNode,       // custom cell content; falls back to accessor
//     sortable?: boolean,
//     sortValue?: (row) => number|string,// "sort by meaning" override - e.g. a status
//                                         // column sorts by severity rank, not the
//                                         // label's alphabetical spelling
//     numeric?: boolean,                 // right-align + tabular-nums
//     truncate?: boolean,                // opt-in single-line ellipsis
//     width?: string,
//   }
// Selection is scoped to the current page: selection.selected is a Set of
// row ids, selection.onToggle(id)/.onToggleAll(ids) mutate it, and "select
// all" only ever means "all rows visible on this page," never the full
// server-side result set.
import { useMemo, useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from './Icons';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { SkeletonBlock } from './LoadingState';
import { Pagination } from './Pagination';
import { rowNavProps } from '../../utils/rowNav';

function defaultSortValue(column, row) {
  const raw = column.accessor ? column.accessor(row) : row[column.key];
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const asDate = Date.parse(raw);
    if (!Number.isNaN(asDate) && /^\d{4}-\d{2}-\d{2}/.test(raw)) return asDate;
  }
  return raw ?? '';
}

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

// aria-sort is only valid on an element with role columnheader/rowheader
// (the <th> itself) - axe's aria-allowed-attr rule flags it on a <button>,
// which has role "button". The <th> carries aria-sort; this button stays a
// plain, real <button> so sorting is keyboard-operable without inventing a
// custom widget role.
function SortButton({ column, direction, onClick }) {
  return (
    <button type="button" className="data-table-sort-btn" onClick={onClick}>
      <span>{column.header}</span>
      <span className="data-table-sort-icons" aria-hidden="true">
        <ChevronUpIcon size={12} className={direction === 'asc' ? 'data-table-sort-active' : ''} />
        <ChevronDownIcon size={12} className={direction === 'desc' ? 'data-table-sort-active' : ''} />
      </span>
    </button>
  );
}

function SkeletonRows({ columns, rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="data-table-row-skeleton">
          {columns.map((col, c) => (
            <td key={col.key} className={col.numeric ? 'data-table-cell-numeric' : ''}>
              <SkeletonBlock width={`${55 + ((r * 13 + c * 29) % 40)}%`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable({
  columns,
  data,
  rowKey = (row) => row.id,
  status = 'success', // 'loading' | 'error' | 'success'
  errorMessage,
  onRetry,
  emptyProps,
  onRowClick,
  rowAriaLabel,
  density = 'comfortable', // 'comfortable' | 'compact'
  selection, // { selected: Set, onToggle(id), onToggleAll(ids) }
  page = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  className = '',
}) {
  const [sort, setSort] = useState({ key: null, direction: null });

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return data;
    const valueOf = column.sortValue ?? ((row) => defaultSortValue(column, row));
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => factor * compare(valueOf(a), valueOf(b)));
  }, [data, sort, columns]);

  const isServerPaged = typeof totalItems === 'number' && typeof onPageChange === 'function';
  const pageCount = isServerPaged
    ? Math.max(1, Math.ceil(totalItems / pageSize))
    : Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = isServerPaged ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
  }

  const visibleIds = pageRows.map(rowKey);
  const allSelected = selection && visibleIds.length > 0 && visibleIds.every((id) => selection.selected.has(id));
  const someSelected = selection && visibleIds.some((id) => selection.selected.has(id));

  return (
    <div className={`data-table-wrapper data-table-${density} ${className}`.trim()}>
      {/* tabIndex so a keyboard user can actually scroll this region when it
          overflows (axe's scrollable-region-focusable) - always present
          rather than conditional on measuring overflow, since that would
          need a resize observer to stay correct and the cost of an
          always-focusable wrapper is negligible. */}
      <div className="data-table-scroll" tabIndex={0}>
        <table className="data-table">
          <thead>
            <tr>
              {selection && (
                <th className="data-table-cell-select">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => el && (el.indeterminate = !allSelected && someSelected)}
                    onChange={() => selection.onToggleAll(visibleIds)}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((col) => {
                const direction = sort.key === col.key ? sort.direction : null;
                const ariaSort = !col.sortable ? undefined : direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';
                return (
                  <th
                    key={col.key}
                    className={col.numeric ? 'data-table-cell-numeric' : ''}
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={ariaSort}
                  >
                    {col.sortable ? (
                      <SortButton column={col} direction={direction} onClick={() => toggleSort(col.key)} />
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && <SkeletonRows columns={selection ? [{ key: '__select' }, ...columns] : columns} />}

            {status === 'error' && (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)}>
                  <ErrorState message={errorMessage} onRetry={onRetry} />
                </td>
              </tr>
            )}

            {status === 'success' && pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)}>
                  <EmptyState {...emptyProps} />
                </td>
              </tr>
            )}

            {status === 'success' &&
              pageRows.map((row) => {
                const id = rowKey(row);
                const interactive = typeof onRowClick === 'function';
                const navProps = interactive ? rowNavProps(() => onRowClick(row), { label: rowAriaLabel?.(row) }) : {};
                return (
                  <tr key={id} {...navProps} className={interactive ? 'data-table-row-interactive' : ''}>
                    {selection && (
                      <td
                        className="data-table-cell-select"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selection.selected.has(id)}
                          onChange={() => selection.onToggle(id)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const content = col.render ? col.render(row) : col.accessor ? col.accessor(row) : row[col.key];
                      return (
                        <td
                          key={col.key}
                          data-label={col.header}
                          data-numeric={col.numeric || undefined}
                          // Truncation is opt-in per column precisely because it hides
                          // text - the cut string must stay recoverable on hover, or a
                          // column like Title just looks broken past the ellipsis.
                          title={col.truncate && typeof content === 'string' ? content : undefined}
                          className={[col.numeric ? 'data-table-cell-numeric' : '', col.truncate ? 'data-table-cell-truncate' : '']
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {status === 'success' && pageRows.length > 0 && (
        <Pagination
          page={page}
          totalPages={pageCount}
          totalItems={isServerPaged ? totalItems : sorted.length}
          pageSize={pageSize}
          onPageChange={onPageChange ?? (() => {})}
        />
      )}
    </div>
  );
}
