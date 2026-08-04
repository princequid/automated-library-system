// src/admin-portal/pages/catalogue/CatalogueDetailPage.jsx
// Real fetch by id (unlike Members/Loans/Staff/Fines) - GET /catalog/items/:id
// is an actual backend endpoint, so this works correctly on a direct URL
// visit or refresh, not just when arriving via a row click.
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { catalogService } from '../../services/catalogService';
import { DetailPageHeader } from '../../components/layout/DetailPageHeader';
import { DetailSection, DetailField } from '../../components/common/DetailSection';
import { Badge, CopyStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { RelativeDate } from '../../components/common/RelativeDate';
import { CatalogueIcon, InfoIcon, ActiveLoansIcon } from '../../components/common/Icons';
import { CatalogueFormModal } from './CatalogueFormModal';
import { CopiesModal } from './CopiesModal';

export function CatalogueDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const canEdit = rankAtLeast(user?.role, 'LIBRARIAN');
  const [editing, setEditing] = useState(false);
  const [managingCopies, setManagingCopies] = useState(false);

  const query = useQuery({ queryKey: ['catalog', 'items', id], queryFn: () => catalogService.get(id) });
  const item = query.data?.data;

  if (query.isPending) return <LoadingState label="Loading item…" />;
  if (query.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(query.error, 'Could not load this catalogue item.')}
        onRetry={query.refetch}
      />
    );
  }

  return (
    <>
      <DetailPageHeader
        backTo="/admin/catalogue"
        backLabel="Back to Catalogue"
        icon={<CatalogueIcon size={22} />}
        iconVariant="primary"
        title={item.title}
        subtitle={item.author}
        status={
          <Badge variant={item.available_copies > 0 ? 'success' : 'danger'}>
            {item.available_copies} / {item.total_copies} available
          </Badge>
        }
        actions={
          canEdit && (
            <>
              <Button variant="outline" onClick={() => setManagingCopies(true)}>
                Manage copies
              </Button>
              <Button onClick={() => setEditing(true)}>Edit</Button>
            </>
          )
        }
      />

      <DetailSection title="Item details" icon={<InfoIcon size={16} />} iconVariant="primary">
        <DetailField label="ISBN" value={item.isbn} />
        <DetailField label="Publisher" value={item.publisher} />
        <DetailField label="Year" value={item.year} />
        <DetailField label="Shelf location" value={item.shelf_location} />
        <DetailField label="Loan period" value={item.loan_period_days ? `${item.loan_period_days} days` : undefined} />
        <DetailField label="Added" value={<RelativeDate value={item.created_at} />} />
        <DetailField label="Subject tags" value={item.subject_tags?.length ? item.subject_tags.join(', ') : undefined} span />
        <DetailField label="Abstract" value={item.abstract} span />
      </DetailSection>

      <DetailSection title="Copies" icon={<ActiveLoansIcon size={16} />} iconVariant="teal">
        <div className="detail-field-full">
          {item.copies?.length ? (
            <ul className="copies-list">
              {item.copies.map((copy) => (
                <li key={copy.id} className="copies-list-row">
                  <span className="copies-list-barcode">{copy.barcode}</span>
                  <CopyStatusBadge status={copy.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-field-value">No copies yet.</p>
          )}
        </div>
      </DetailSection>

      {canEdit && (
        <>
          <CatalogueFormModal
            open={editing}
            onClose={() => setEditing(false)}
            item={item}
            onManageCopies={() => {
              setEditing(false);
              setManagingCopies(true);
            }}
          />
          <CopiesModal open={managingCopies} onClose={() => setManagingCopies(false)} item={item} />
        </>
      )}
    </>
  );
}
