// src/admin-portal/pages/maintenance/ResolveMaintenanceModal.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { maintenanceService } from '../../services/maintenanceService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { useToast } from '../../components/common/Toast';

export function ResolveMaintenanceModal({ ticket, onClose }) {
  const [outcome, setOutcome] = useState('repaired');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () => maintenanceService.resolve(ticket.id, { outcome, notes: notes.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success(outcome === 'repaired' ? 'Copy returned to service.' : 'Copy withdrawn from circulation.');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not resolve this ticket.')),
  });

  return (
    <Modal
      open={!!ticket}
      onClose={onClose}
      title="Resolve maintenance ticket"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
            Resolve
          </Button>
        </>
      }
    >
      {ticket && (
        <>
          <p className="detail-field-value" style={{ marginBottom: 'var(--space-4)' }}>
            {ticket.copy.catalog_item.title} — <code>{ticket.copy.barcode}</code>
          </p>
          <FormField label="Outcome" required>
            {(props) => (
              <select {...props} className="select" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                <option value="repaired">Repaired — return to AVAILABLE</option>
                <option value="withdraw">Beyond repair — withdraw from circulation</option>
              </select>
            )}
          </FormField>
          <FormField label="Notes">
            {(props) => <textarea {...props} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </FormField>
        </>
      )}
    </Modal>
  );
}
