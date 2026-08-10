// src/admin-portal/components/common/OverrideReasonModal.jsx
// Shared confirmation dialog for the one case an ADMINISTRATOR is allowed to
// touch a Librarian-owned operational action (circulation issue/return/renew,
// fine creation/waive/pay-manual/dispute-resolve, force-delete a catalog item).
// The backend's requireLibrarianOrOverride() rejects these calls from an
// ADMINISTRATOR with 400 unless the request body carries a non-empty
// override_reason, which is exactly what this dialog collects and what the
// resulting AuditLog row is flagged with (is_override/override_reason). A
// LIBRARIAN never sees this - their calls succeed with no reason required.
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormField } from './FormField';

export function OverrideReasonModal({ open, onClose, title, description, onConfirm, loading }) {
  const [reason, setReason] = useState('');

  function handleClose() {
    setReason('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title ?? 'Administrator override'}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(reason.trim())}
            loading={loading}
            disabled={!reason.trim()}
          >
            Confirm override
          </Button>
        </>
      }
    >
      <p className="member-created-note">
        {description ??
          'This is normally a Librarian action. As an Administrator, you can proceed, but the reason is required and recorded in the audit log as an override.'}
      </p>
      <FormField label="Override reason" required>
        {(props) => (
          <input
            {...props}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this being done by an Administrator?"
            autoFocus
          />
        )}
      </FormField>
    </Modal>
  );
}
