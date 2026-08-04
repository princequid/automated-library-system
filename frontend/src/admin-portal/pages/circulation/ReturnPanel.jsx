// src/admin-portal/pages/circulation/ReturnPanel.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { circulationService } from '../../services/circulationService';
import { TableCard } from '../../components/common/TableCard';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

export function ReturnPanel() {
  const [barcode, setBarcode] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const returnBook = useMutation({
    mutationFn: () => circulationService.return({ barcode: barcode.trim() }),
    onSuccess: (envelope) => {
      queryClient.invalidateQueries({ queryKey: ['circulation', 'loans'] });
      queryClient.invalidateQueries({ queryKey: ['circulation', 'reshelf'] });
      toast.success(envelope.data?.fine ? 'Returned - an overdue fine was recorded.' : 'Returned.');
      setBarcode('');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not return this book.')),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!barcode.trim()) return;
    returnBook.mutate();
  }

  return (
    <TableCard title="Return a book" description="Scan or type the copy's barcode.">
      <form onSubmit={handleSubmit} className="circulation-return-form">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Barcode"
          autoFocus
          className="circulation-return-input"
        />
        <Button type="submit" loading={returnBook.isPending} disabled={!barcode.trim()}>
          Return
        </Button>
      </form>
    </TableCard>
  );
}
