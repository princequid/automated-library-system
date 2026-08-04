// frontend/src/components/ui/data-table.tsx
// Premium wrapper over TanStack Table v8. Uppercase 11px header row, hairline row
// separators, hover tint, staggered fade-in on first load, horizontal scroll on
// narrow viewports. Adds sorting, row selection + a bulk-action bar, and
// pagination in two modes:
//   - `{ mode: 'client' }` - table paginates `data` itself (use for endpoints with
//     no server-side paging, e.g. Reservations/Fines).
//   - `{ mode: 'server', page, totalPages, onPageChange }` - `data` is already just
//     the current page's rows; the table only renders the pager UI (Catalog/Users,
//     which already support `page`/`limit` query params).
import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DURATION } from '@/lib/motion';
import { Checkbox } from './checkbox';

type ClientPagination = { mode: 'client'; pageSize?: number };
type ServerPagination = { mode: 'server'; page: number; totalPages: number; onPageChange: (page: number) => void };

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
  getRowId?: (row: T, index: number) => string;

  enableSelection?: boolean;
  selectedIds?: Record<string, boolean>;
  onSelectedIdsChange?: (selected: Record<string, boolean>) => void;
  renderBulkActions?: (selectedRows: T[], clearSelection: () => void) => React.ReactNode;

  /** Render an expandable panel below a row (e.g. Catalog's copies list). */
  renderExpanded?: (row: T) => React.ReactNode;
  isRowExpanded?: (row: T) => boolean;

  pagination?: ClientPagination | ServerPagination;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyLabel = 'No records',
  getRowId,
  renderExpanded,
  isRowExpanded,
  enableSelection = false,
  selectedIds,
  onSelectedIdsChange,
  renderBulkActions,
  pagination,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [internalSelection, setInternalSelection] = React.useState<RowSelectionState>({});
  const rowSelection = selectedIds ?? internalSelection;
  const setRowSelection = onSelectedIdsChange ?? setInternalSelection;

  const tableColumns = React.useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!enableSelection) return columns;
    const selectColumn: ColumnDef<T, unknown> = {
      id: '__select',
      size: 36,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    };
    return [selectColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(next);
    },
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pagination?.mode === 'client'
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize: pagination.pageSize ?? 10 } },
        }
      : {}),
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;
  const selectedRows = React.useMemo(
    () => (selectedCount === 0 ? [] : table.getSelectedRowModel().rows.map((r) => r.original)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowSelection, data]
  );
  const clearSelection = () => setRowSelection({});

  const rows = table.getRowModel().rows;

  return (
    <div>
      <AnimatePresence>
        {enableSelection && selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: DURATION.medium }}
            className="mb-3 flex items-center gap-3 overflow-hidden rounded-control border border-primary-tint bg-primary-tint px-4 py-2.5"
          >
            <span className="text-sm font-medium text-primary-hover">{selectedCount} selected</span>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 text-xs text-primary-hover hover:underline"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
            <div className="ml-auto flex items-center gap-2">
              {renderBulkActions?.(selectedRows, clearSelection)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="overflow-x-auto rounded-card border border-border bg-card shadow-sm"
        tabIndex={0}
        role="region"
        aria-label="Scrollable table"
      >
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-text-secondary"
                      style={header.column.id === '__select' ? { width: 36 } : undefined}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 hover:text-text-primary"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length} className="px-4 py-10 text-center text-text-secondary">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const expanded = isRowExpanded?.(row.original) ?? false;
                return (
                  <React.Fragment key={row.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4), duration: DURATION.medium }}
                      onClick={() => onRowClick?.(row.original)}
                      className={cn(
                        'border-b border-border transition-colors hover:bg-bg',
                        !expanded && 'last:border-0',
                        onRowClick && 'cursor-pointer active:bg-primary-tint/30',
                        row.getIsSelected() && 'bg-primary-tint/40'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-text-primary align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                    {renderExpanded && (
                      <AnimatePresence>
                        {expanded && (
                          <tr className="border-b border-border last:border-0">
                            <td colSpan={tableColumns.length} className="bg-bg/50 p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: DURATION.medium }}
                                className="overflow-hidden"
                              >
                                {renderExpanded(row.original)}
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination?.mode === 'client' && table.getPageCount() > 1 && (
        <Pager
          page={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onPrev={() => table.previousPage()}
          onNext={() => table.nextPage()}
          canPrev={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
        />
      )}
      {pagination?.mode === 'server' && pagination.totalPages > 1 && (
        <Pager
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPrev={() => pagination.onPageChange(pagination.page - 1)}
          onNext={() => pagination.onPageChange(pagination.page + 1)}
          canPrev={pagination.page > 1}
          canNext={pagination.page < pagination.totalPages}
        />
      )}
    </div>
  );
}

function Pager({
  page,
  totalPages,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex h-8 w-8 items-center justify-center rounded-control border border-border hover:bg-bg disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex h-8 w-8 items-center justify-center rounded-control border border-border hover:bg-bg disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
