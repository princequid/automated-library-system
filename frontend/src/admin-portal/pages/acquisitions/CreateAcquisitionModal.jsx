// src/admin-portal/pages/acquisitions/CreateAcquisitionModal.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { acquisitionsService } from '../../services/acquisitionsService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { useToast } from '../../components/common/Toast';

const EMPTY = { title: '', author: '', isbn: '', notes: '', estimated_cost: '' };

export function CreateAcquisitionModal({ open, onClose }) {
  const [values, setValues] = useState(EMPTY);
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      acquisitionsService.create({
        title: values.title.trim(),
        author: values.author.trim() || undefined,
        isbn: values.isbn.trim() || undefined,
        notes: values.notes.trim() || undefined,
        estimated_cost: values.estimated_cost ? Number(values.estimated_cost) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquisitions'] });
      toast.success('Acquisition request submitted.');
      setValues(EMPTY);
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not submit this request.')),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a book"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!values.title.trim()}>
            Submit request
          </Button>
        </>
      }
    >
      <form className="form-grid-2" onSubmit={(e) => e.preventDefault()}>
        <FormField label="Title" required className="form-field-span-2">
          {(props) => <input {...props} value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} />}
        </FormField>
        <FormField label="Author">
          {(props) => <input {...props} value={values.author} onChange={(e) => setValues((v) => ({ ...v, author: e.target.value }))} />}
        </FormField>
        <FormField label="ISBN">
          {(props) => <input {...props} value={values.isbn} onChange={(e) => setValues((v) => ({ ...v, isbn: e.target.value }))} />}
        </FormField>
        <FormField label="Estimated cost (GHS)" hint="Ballpark figure - feeds Administrator expenditure reporting once received.">
          {(props) => (
            <input
              {...props}
              type="number"
              min={0}
              step="0.01"
              value={values.estimated_cost}
              onChange={(e) => setValues((v) => ({ ...v, estimated_cost: e.target.value }))}
            />
          )}
        </FormField>
        <FormField label="Notes" className="form-field-span-2">
          {(props) => <textarea {...props} rows={2} value={values.notes} onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))} />}
        </FormField>
      </form>
    </Modal>
  );
}
