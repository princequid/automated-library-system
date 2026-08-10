// src/admin-portal/pages/acquisitions/ReceiveAcquisitionModal.jsx
// The book has arrived - this catalogues it for real (creates the CatalogItem
// + copies) and links back to the request, closing Acquisition -> Catalogue.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { acquisitionsService } from '../../services/acquisitionsService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { useToast } from '../../components/common/Toast';

export function ReceiveAcquisitionModal({ acquisition, onClose }) {
  const [values, setValues] = useState({ publisher: '', year: '', shelf_location: '', quantity: 1 });
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      acquisitionsService.receive(acquisition.id, {
        publisher: values.publisher.trim() || undefined,
        year: values.year ? Number(values.year) : undefined,
        shelf_location: values.shelf_location.trim() || undefined,
        quantity: Number(values.quantity) || 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquisitions'] });
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      toast.success('Catalogued.');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not catalogue this item.')),
  });

  return (
    <Modal
      open={!!acquisition}
      onClose={onClose}
      title="Receive into catalogue"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
            Catalogue it
          </Button>
        </>
      }
    >
      {acquisition && (
        <form className="form-grid-2" onSubmit={(e) => e.preventDefault()}>
          <p className="detail-field-value form-field-span-2">{acquisition.title}</p>
          <FormField label="Publisher">
            {(props) => <input {...props} value={values.publisher} onChange={(e) => setValues((v) => ({ ...v, publisher: e.target.value }))} />}
          </FormField>
          <FormField label="Year">
            {(props) => <input {...props} type="number" value={values.year} onChange={(e) => setValues((v) => ({ ...v, year: e.target.value }))} />}
          </FormField>
          <FormField label="Shelf location">
            {(props) => <input {...props} value={values.shelf_location} onChange={(e) => setValues((v) => ({ ...v, shelf_location: e.target.value }))} />}
          </FormField>
          <FormField label="Number of copies" required>
            {(props) => <input {...props} type="number" min={1} value={values.quantity} onChange={(e) => setValues((v) => ({ ...v, quantity: e.target.value }))} />}
          </FormField>
        </form>
      )}
    </Modal>
  );
}
