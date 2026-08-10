// src/admin-portal/pages/loans/useLoanActions.js
// Renew/Return mutations shared by LoansPage's kebab menu and
// LoanDetailPage's action buttons - identical logic, one place.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { circulationService } from '../../services/circulationService';
import { useToast } from '../../components/common/Toast';

export function useLoanActions(loan) {
  const queryClient = useQueryClient();
  const toast = useToast();

  // overrideReason is only ever passed for an ADMINISTRATOR acting outside
  // the normal Librarian workflow - see requireOverrideIfAdministrator() /
  // requireLibrarianOrOverride() on the backend.
  const renew = useMutation({
    mutationFn: (overrideReason) =>
      circulationService.renew({ loan_id: loan.id, ...(overrideReason ? { override_reason: overrideReason } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulation', 'loans'] });
      toast.success('Loan renewed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not renew this loan.')),
  });

  const returnLoan = useMutation({
    mutationFn: (overrideReason) =>
      circulationService.return({ barcode: loan.copy.barcode, ...(overrideReason ? { override_reason: overrideReason } : {}) }),
    onSuccess: (envelope) => {
      queryClient.invalidateQueries({ queryKey: ['circulation', 'loans'] });
      toast.success(envelope.data?.fine ? 'Returned - an overdue fine was recorded.' : 'Returned.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not return this loan.')),
  });

  return { renew, returnLoan };
}
