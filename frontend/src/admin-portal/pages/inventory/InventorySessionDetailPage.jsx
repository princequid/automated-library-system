// src/admin-portal/pages/inventory/InventorySessionDetailPage.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { inventoryService } from '../../services/inventoryService';
import { DetailPageHeader } from '../../components/layout/DetailPageHeader';
import { DetailSection, DetailField } from '../../components/common/DetailSection';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { InventoryIcon } from '../../components/common/Icons';
import { useToast } from '../../components/common/Toast';

export function InventorySessionDetailPage() {
  const { id } = useParams();
  const [barcode, setBarcode] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [selectedMissing, setSelectedMissing] = useState(new Set());
  const queryClient = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: ['inventory', 'sessions', id], queryFn: () => inventoryService.getOne(id) });
  const session = query.data?.data;

  const scanMutation = useMutation({
    mutationFn: (code) => inventoryService.scan(id, code),
    onSuccess: (envelope) => {
      setLastResult(envelope.data);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'sessions', id] });
      setBarcode('');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not record that scan.')),
  });

  const completeMutation = useMutation({
    mutationFn: () => inventoryService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'sessions', id] });
      toast.success('Session completed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not complete this session.')),
  });

  const markLostMutation = useMutation({
    mutationFn: () => inventoryService.markMissingAsLost(id, Array.from(selectedMissing)),
    onSuccess: () => {
      toast.success(`${selectedMissing.size} copy(ies) marked LOST.`);
      setSelectedMissing(new Set());
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update those copies.')),
  });

  if (query.isPending) return <LoadingState label="Loading session…" />;
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error)} onRetry={query.refetch} />;

  const isCompleted = session.status === 'COMPLETED';
  const missing = session.missing_copies ?? [];

  return (
    <>
      <DetailPageHeader
        backTo="/admin/inventory"
        backLabel="Back to Inventory"
        icon={<InventoryIcon size={22} />}
        iconVariant="primary"
        title={session.shelf?.name ?? 'Whole-library stocktake'}
        subtitle={`Started ${new Date(session.started_at).toLocaleString()}`}
        status={<Badge variant={isCompleted ? 'success' : 'warning'}>{session.status}</Badge>}
        actions={!isCompleted && <Button onClick={() => completeMutation.mutate()} loading={completeMutation.isPending}>Complete session</Button>}
      />

      <DetailSection title="Progress">
        <DetailField label="Expected copies" value={session.expected_count} />
        <DetailField label="Scanned" value={session.scanned_count} />
      </DetailSection>

      {!isCompleted && (
        <DetailSection title="Scan a barcode">
          <div className="detail-field-full">
            <form
              className="fines-toolbar-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (barcode.trim()) scanMutation.mutate(barcode.trim());
              }}
            >
              <input
                type="text"
                autoFocus
                placeholder="Scan or type a barcode…"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="member-status-reason"
              />
              <Button type="submit" loading={scanMutation.isPending}>Record scan</Button>
            </form>
            {lastResult && (
              <p className="detail-field-value" style={{ marginTop: 'var(--space-3)' }}>
                {lastResult.matched ? `✓ Matched: ${lastResult.copy?.barcode}` : '✗ No copy found for that barcode.'}
              </p>
            )}
          </div>
        </DetailSection>
      )}

      {isCompleted && missing.length > 0 && (
        <DetailSection title={`Missing copies (${missing.length})`}>
          <div className="detail-field-full">
            <ul className="copies-list">
              {missing.map((copy) => (
                <li key={copy.id} className="copies-list-row">
                  <input
                    type="checkbox"
                    checked={selectedMissing.has(copy.id)}
                    onChange={(e) =>
                      setSelectedMissing((prev) => {
                        const next = new Set(prev);
                        e.target.checked ? next.add(copy.id) : next.delete(copy.id);
                        return next;
                      })
                    }
                  />
                  <span className="copies-list-barcode">{copy.barcode}</span>
                  <span className="detail-field-value">{copy.title}</span>
                </li>
              ))}
            </ul>
            {selectedMissing.size > 0 && (
              <Button variant="outline" style={{ marginTop: 'var(--space-3)' }} onClick={() => markLostMutation.mutate()} loading={markLostMutation.isPending}>
                Mark {selectedMissing.size} selected as LOST
              </Button>
            )}
          </div>
        </DetailSection>
      )}
    </>
  );
}
