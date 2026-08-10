// src/admin-portal/pages/catalogData/SimpleEntityList.jsx
// Shared body for the Authors/Publishers/Categories tabs - three near-identical
// name-list CRUD surfaces, matching the backend's own three-near-identical-
// routers shape (catalogData.routes.ts).
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';

export function SimpleEntityList({ queryKey, service, label, extraField }) {
  const [name, setName] = useState('');
  const [extra, setExtra] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey, queryFn: service.list });
  const rows = query.data?.data ?? [];

  const create = useMutation({
    mutationFn: () => service.create({ name: name.trim(), ...(extraField ? { [extraField.key]: extra.trim() || undefined } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setName('');
      setExtra('');
      toast.success(`${label.slice(0, -1)} added.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, `Could not add this ${label.slice(0, -1).toLowerCase()}.`)),
  });

  const remove = useMutation({
    mutationFn: (id) => service.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete this - it may still be in use.')),
  });

  return (
    <div className="detail-field-full">
      <form
        className="fines-toolbar-row"
        style={{ marginBottom: 'var(--space-4)' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <input type="text" placeholder={`New ${label.slice(0, -1).toLowerCase()} name…`} value={name} onChange={(e) => setName(e.target.value)} className="member-status-reason" />
        {extraField && (
          <input type="text" placeholder={extraField.placeholder} value={extra} onChange={(e) => setExtra(e.target.value)} className="member-status-reason" />
        )}
        <Button type="submit" size="sm" loading={create.isPending}>Add</Button>
      </form>

      {query.isPending && <LoadingState label={`Loading ${label.toLowerCase()}…`} />}
      {query.isError && <ErrorState message={apiErrorMessage(query.error)} onRetry={query.refetch} />}
      {query.isSuccess && rows.length === 0 && <EmptyState title={`No ${label.toLowerCase()} yet`} />}
      {rows.length > 0 && (
        <ul className="member-mini-list">
          {rows.map((row) => (
            <li key={row.id}>
              <span>{row.name}</span>
              <button type="button" className="row-actions-view" onClick={() => remove.mutate(row.id)} disabled={remove.isPending}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
