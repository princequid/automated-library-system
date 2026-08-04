// src/admin-portal/pages/catalogue/CataloguePage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { catalogService } from '../../services/catalogService';
import { useApiList } from '../../hooks/useApiList';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { Button } from '../../components/common/Button';
import { PlusIcon } from '../../components/common/Icons';
import { CatalogueFormModal } from './CatalogueFormModal';
import { CopiesModal } from './CopiesModal';

const PAGE_SIZE = 20;

// Widths sum to 100% - table-layout: fixed (components.css) splits any
// column with no explicit width evenly among its siblings instead of by
// what it actually needs. ISBN/Added moved to the detail page so this
// table stops cramming 6 columns into one row - see CatalogueDetailPage.jsx.
const COLUMNS = [
  { key: 'title', header: 'Title', accessor: (row) => row.title, sortable: true, truncate: true, width: '34%' },
  { key: 'author', header: 'Author', accessor: (row) => row.author, sortable: true, truncate: true, width: '26%' },
  {
    key: 'copies',
    header: 'Copies',
    numeric: true,
    sortable: true,
    sortValue: (row) => row.available_copies,
    render: (row) => `${row.available_copies} / ${row.total_copies}`,
    width: '13%',
  },
  { key: 'shelf_location', header: 'Shelf', accessor: (row) => row.shelf_location ?? '—', width: '15%' },
];

/** Real counts only - one lightweight list call per pill, reading meta.total. Never a guessed number. */
function useCataloguePillCounts() {
  const all = useQuery({ queryKey: ['catalog', 'items', 'count', 'all'], queryFn: () => catalogService.list({ limit: 1 }) });
  const available = useQuery({
    queryKey: ['catalog', 'items', 'count', 'available'],
    queryFn: () => catalogService.list({ limit: 1, available_only: true }),
  });
  const allTotal = all.data?.meta?.total;
  const availableTotal = available.data?.meta?.total;
  return {
    all: allTotal,
    available: availableTotal,
    outOfStock: typeof allTotal === 'number' && typeof availableTotal === 'number' ? allTotal - availableTotal : undefined,
  };
}

export function CataloguePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit = rankAtLeast(user?.role, 'LIBRARIAN');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('all'); // 'all' | 'available' | 'out'
  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = create, object = edit
  const [copiesItem, setCopiesItem] = useState(null);

  const counts = useCataloguePillCounts();
  const pillOptions = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'available', label: 'Available', count: counts.available },
    { key: 'out', label: 'Out of stock', count: counts.outOfStock },
  ];

  const { rows, meta, status, errorMessage, refetch } = useApiList(['catalog', 'items'], catalogService.list, {
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    available_only: availability === 'available' ? true : undefined,
  });
  // "Out of stock" has no direct query param on the backend - filter the
  // loaded page client-side rather than inventing one. This only affects
  // what's shown on the CURRENT page, same as every other client-side
  // narrowing in this codebase; the pill's count above is still the real,
  // server-derived total.
  const visibleRows = availability === 'out' ? rows.filter((r) => r.available_copies === 0) : rows;

  function openItem(row) {
    navigate(`/admin/catalogue/${row.id}`);
  }

  const columns = [
    ...COLUMNS,
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <RowActions
          onView={() => openItem(row)}
          menuItems={
            canEdit
              ? [
                  { label: 'Edit', onClick: () => setFormItem(row) },
                  { label: 'Manage copies', onClick: () => setCopiesItem(row) },
                ]
              : undefined
          }
        />
      ),
      width: '12%',
    },
  ];

  return (
    <>
      <PageHeader
        title="Catalogue"
        description="Titles and their physical copies."
        actions={
          canEdit && (
            <Button onClick={() => setFormItem(null)}>
              <PlusIcon size={16} /> Add item
            </Button>
          )
        }
      />

      <TableCard>
        <div className="table-toolbar">
          <SearchBar value={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search title or author…" />
          <FilterPills
            options={pillOptions}
            active={availability}
            onChange={(key) => { setAvailability(key); setPage(1); }}
          />
          <p className="filter-results-count">{typeof meta?.total === 'number' ? `${meta.total} results` : ' '}</p>
        </div>
      </TableCard>

      <TableCard>
        <DataTable
          columns={columns}
          data={visibleRows}
          status={status}
          errorMessage={errorMessage}
          onRetry={refetch}
          emptyProps={{ filtered: !!search || availability !== 'all', title: search ? undefined : 'No catalogue items yet' }}
          onRowClick={openItem}
          rowAriaLabel={(row) => `Open ${row.title}`}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={meta?.total}
          onPageChange={setPage}
        />
      </TableCard>

      {canEdit && (
        <CatalogueFormModal
          open={formItem !== undefined}
          onClose={() => setFormItem(undefined)}
          item={formItem}
          onManageCopies={(row) => {
            setFormItem(undefined);
            setCopiesItem(row);
          }}
        />
      )}
      <CopiesModal open={!!copiesItem} onClose={() => setCopiesItem(null)} item={copiesItem} />
    </>
  );
}
