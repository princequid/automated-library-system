// src/admin-portal/pages/circulation/ReshelfPanel.jsx
import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { circulationService } from '../../services/circulationService';
import { TableCard } from '../../components/common/TableCard';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export function ReshelfPanel() {
  const query = useQuery({
    queryKey: ['circulation', 'reshelf'],
    queryFn: () => circulationService.reshelf(),
  });

  const items = query.data?.data ?? [];

  return (
    <TableCard title="Reshelf queue" description="Copies returned today, ordered by shelf location.">
      {query.isPending && <LoadingState label="Loading…" />}
      {query.isError && <ErrorState message={apiErrorMessage(query.error)} onRetry={query.refetch} />}
      {query.isSuccess && items.length === 0 && <EmptyState title="Nothing to reshelf" description="No returns yet today." />}
      {items.length > 0 && (
        <ul className="reshelf-list">
          {items.map((entry) => (
            <li key={entry.loan_id} className="reshelf-list-row">
              <span className="reshelf-location">{entry.shelf_location}</span>
              <span className="reshelf-title">{entry.title}</span>
              <span className="reshelf-author">{entry.author}</span>
              <span className="reshelf-barcode">{entry.barcode}</span>
            </li>
          ))}
        </ul>
      )}
    </TableCard>
  );
}
