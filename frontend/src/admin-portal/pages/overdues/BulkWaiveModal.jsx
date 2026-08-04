// src/admin-portal/pages/overdues/BulkWaiveModal.jsx
// PUT /fines/:id/waive has no batch form - "waive selected" is genuinely N
// sequential requests. This shows real per-item progress as it happens and,
// if any fail, reports the result as PARTIAL rather than rolling it into a
// single success/fail toast that would misrepresent what actually happened.
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { finesService } from '../../services/finesService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { SpinnerIcon, CheckIcon, ErrorIcon } from '../../components/common/Icons';

export function BulkWaiveModal({ open, onClose, fines }) {
  const [reason, setReason] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({}); // { [fineId]: 'pending' | 'success' | 'error' }
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const completedCount = Object.values(results).filter((r) => r !== 'pending').length;
  const failed = Object.entries(results).filter(([, v]) => v === 'error');

  async function runBulkWaive() {
    setRunning(true);
    setDone(false);
    const initial = Object.fromEntries(fines.map((f) => [f.id, 'pending']));
    setResults(initial);

    for (const fine of fines) {
      try {
        await finesService.waiveOne(fine.id, { reason: reason.trim() });
        setResults((prev) => ({ ...prev, [fine.id]: 'success' }));
      } catch (err) {
        setResults((prev) => ({ ...prev, [fine.id]: 'error' }));
        // eslint-disable-next-line no-console
        console.error(apiErrorMessage(err));
      }
    }

    setRunning(false);
    setDone(true);
    queryClient.invalidateQueries({ queryKey: ['fines'] });
  }

  function handleClose() {
    setReason('');
    setResults({});
    setDone(false);
    onClose();
  }

  const succeededCount = Object.values(results).filter((r) => r === 'success').length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Waive ${fines.length} fine${fines.length === 1 ? '' : 's'}`}
      footer={
        !done ? (
          <>
            <Button variant="outline" onClick={handleClose} disabled={running}>
              Cancel
            </Button>
            <Button onClick={runBulkWaive} loading={running} disabled={!reason.trim()}>
              Waive all
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>Close</Button>
        )
      }
    >
      {!running && !done && (
        <>
          <p className="bulk-waive-note">
            This sends {fines.length} separate request{fines.length === 1 ? '' : 's'} - one per fine. The same reason is
            recorded on each.
          </p>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required)"
            className="bulk-waive-reason-input"
            autoFocus
          />
        </>
      )}

      {(running || done) && (
        <>
          {done && (
            <p className={`bulk-waive-summary ${failed.length > 0 ? 'is-partial' : 'is-success'}`}>
              {failed.length === 0
                ? `All ${succeededCount} fines waived.`
                : `${succeededCount} waived, ${failed.length} failed - see below.`}
            </p>
          )}
          <ul className="bulk-waive-progress-list">
            {fines.map((fine) => {
              const state = results[fine.id] ?? 'pending';
              return (
                <li key={fine.id} className={`bulk-waive-progress-row is-${state}`}>
                  <span>{fine.user.name} - GHS {Number(fine.amount).toFixed(2)}</span>
                  {state === 'pending' && <SpinnerIcon size={14} className="bulk-waive-spinner" />}
                  {state === 'success' && <CheckIcon size={14} />}
                  {state === 'error' && <ErrorIcon size={14} />}
                </li>
              );
            })}
          </ul>
          {!done && (
            <p className="bulk-waive-progress-count">
              {completedCount} of {fines.length} complete
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
