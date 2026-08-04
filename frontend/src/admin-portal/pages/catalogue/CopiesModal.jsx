// src/admin-portal/pages/catalogue/CopiesModal.jsx
// Per-item copy management: list existing copies (barcode/status/condition),
// add N new copies, and flip a copy's status (e.g. mark DAMAGED). Separate
// from CatalogueFormModal because copies are a different resource
// (backend/src/modules/catalog/dto/catalog.dto.ts's addCopiesSchema /
// updateCopySchema) with their own endpoints, not fields on the item itself.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { catalogService } from '../../services/catalogService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { Select } from '../../components/common/Select';
import { CopyStatusBadge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';

const COPY_STATUS_OPTIONS = ['AVAILABLE', 'ON_LOAN', 'RESERVED', 'DAMAGED', 'LOST', 'WITHDRAWN'].map((v) => ({
  value: v,
  label: v.replace('_', ' '),
}));

export function CopiesModal({ open, onClose, item }) {
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();
  const toast = useToast();

  const copiesQuery = useQuery({
    queryKey: ['catalog', 'copies', item?.id],
    queryFn: () => catalogService.listCopies(item.id),
    enabled: open && !!item,
  });

  const addCopies = useMutation({
    mutationFn: () => catalogService.addCopies(item.id, { quantity: Number(quantity) || 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'copies', item.id] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'items'] });
      toast.success(`Added ${quantity} cop${quantity === 1 ? 'y' : 'ies'}.`);
      setQuantity(1);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not add copies.')),
  });

  const updateStatus = useMutation({
    mutationFn: ({ copyId, status }) => catalogService.updateCopy(copyId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'copies', item.id] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'items'] });
      toast.success('Copy status updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update this copy.')),
  });

  if (!item) return null;
  const copies = copiesQuery.data?.data ?? [];

  return (
    <Modal open={open} onClose={onClose} title={`Copies of "${item.title}"`} size="lg">
      <div className="copies-add-row">
        <FormField label="Add copies" hint="Auto-generates barcodes.">
          {(props) => (
            <input {...props} type="number" min={1} max={100} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          )}
        </FormField>
        <Button onClick={() => addCopies.mutate()} loading={addCopies.isPending} size="sm">
          Add
        </Button>
      </div>

      {copiesQuery.isPending && <LoadingState label="Loading copies…" />}
      {copiesQuery.isError && (
        <ErrorState message={apiErrorMessage(copiesQuery.error)} onRetry={copiesQuery.refetch} />
      )}
      {copiesQuery.isSuccess && copies.length === 0 && <EmptyState title="No copies yet" description="Add the first copy above." />}

      {copiesQuery.isSuccess && copies.length > 0 && (
        <ul className="copies-list">
          {copies.map((copy) => (
            <li key={copy.id} className="copies-list-row">
              <span className="copies-list-barcode">{copy.barcode}</span>
              <CopyStatusBadge status={copy.status} />
              <div className="copies-list-status-select">
                <Select
                  aria-label={`Change status for copy ${copy.barcode}`}
                  options={COPY_STATUS_OPTIONS}
                  value={copy.status}
                  disabled={updateStatus.isPending}
                  onChange={(e) => updateStatus.mutate({ copyId: copy.id, status: e.target.value })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
