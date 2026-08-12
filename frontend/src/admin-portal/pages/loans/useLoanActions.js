// src/admin-portal/pages/loans/useLoanActions.js
// Renew/Return mutations shared by LoansPage's kebab menu and
// LoanDetailPage's action buttons - identical logic, one place. Loans is a
// LIBRARIAN-only page (see constants/nav.js), so these never run as an
// Administrator override - that's an API-only emergency path with no UI.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { circulationService } from '../../services/circulationService';
import { useToast } from '../../components/common/Toast';

export function useLoanActions(loan) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const renew = useMutation({
    mutationFn: () => circulationService.renew({ loan_id: loan.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulation', 'loans'] });
      toast.success('Loan renewed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not renew this loan.')),
  });

  const returnLoan = useMutation({
    mutationFn: () => circulationService.return({ barcode: loan.copy.barcode }),
    onSuccess: (envelope) => {
      queryClient.invalidateQueries({ queryKey: ['circulation', 'loans'] });
      toast.success(envelope.data?.fine ? 'Returned - an overdue fine was recorded.' : 'Returned.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not return this loan.')),
  });

  return { renew, returnLoan };
}
