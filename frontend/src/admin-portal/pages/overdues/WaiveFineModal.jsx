// src/admin-portal/pages/overdues/WaiveFineModal.jsx
// Single-fine waive, shared by FinesCard's row action and FineDetailPage -
// a real dialog with a required-reason field, not a window.prompt().
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiErrorMessage } from '@/lib/api';
import { finesService } from '../../services/finesService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { useToast } from '../../components/common/Toast';

export function WaiveFineModal({ open, onClose, fine }) {
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  // waive is requireLibrarianOrOverride() on the backend - LIBRARIAN needs
  // only the waive `reason`; ADMINISTRATOR additionally needs override_reason,
  // which this single reason field doubles as (one justification serves both).
  const isAdministrator = user?.role === 'ADMINISTRATOR';

  const waive = useMutation({
    mutationFn: () =>
      finesService.waiveOne(fine.id, {
        reason: reason.trim(),
        ...(isAdministrator ? { override_reason: reason.trim() } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      toast.success('Fine waived.');
      setReason('');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not waive this fine.')),
  });

  if (!fine) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Waive fine"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={waive.isPending}>
            Cancel
          </Button>
          <Button onClick={() => waive.mutate()} loading={waive.isPending} disabled={!reason.trim()}>
            Waive
          </Button>
        </>
      }
    >
      <p className="member-created-note">
        Waiving GHS {Number(fine.amount).toFixed(2)} for {fine.user.name} - {fine.reason}
        {isAdministrator && ' This is normally a Librarian action; as an Administrator it will be recorded as an override.'}
      </p>
      <FormField label="Reason" required>
        {(props) => <input {...props} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required for the audit trail" autoFocus />}
      </FormField>
    </Modal>
  );
}
