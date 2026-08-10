// src/admin-portal/pages/settings/SettingsPage.jsx
// GET /settings is LIBRARIAN+ (read); PUT /settings is ADMINISTRATOR-only - the
// page is reachable by LIBRARIAN+ so it can be reviewed, but every field is
// disabled and there's no Save button below ADMINISTRATOR, mirroring the same
// rankAtLeast-gated-control pattern already used for Edit/Manage-copies
// buttons on the Catalogue detail page.
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { settingsService } from '../../services/settingsService';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../components/common/Toast';

export function SettingsPage() {
  const { user } = useAuthStore();
  const canEdit = rankAtLeast(user?.role, 'ADMINISTRATOR');
  const [values, setValues] = useState({});
  const queryClient = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: ['settings'], queryFn: settingsService.list });
  const rows = query.data?.data ?? [];

  useEffect(() => {
    if (rows.length) setValues(Object.fromEntries(rows.map((r) => [r.key, r.value])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt]);

  const save = useMutation({
    mutationFn: () =>
      settingsService.setMany(
        rows.filter((r) => values[r.key] !== r.value).map((r) => ({ key: r.key, value: values[r.key] }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save these settings.')),
  });

  const dirty = rows.some((r) => values[r.key] !== undefined && values[r.key] !== r.value);

  if (query.isPending) return <LoadingState label="Loading settings…" />;
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error)} onRetry={query.refetch} />;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Borrowing policy, fine rates, and system-wide configuration."
        actions={canEdit && <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty}>Save changes</Button>}
      />

      <TableCard>
        <div className="detail-field-full form-grid-2">
          {rows.map((row) => (
            <FormField key={row.key} label={row.key.replace(/_/g, ' ')} hint={row.description}>
              {(props) =>
                row.type === 'boolean' ? (
                  <select
                    {...props}
                    className="select"
                    disabled={!canEdit}
                    value={values[row.key] ?? row.value}
                    onChange={(e) => setValues((v) => ({ ...v, [row.key]: e.target.value }))}
                  >
                    <option value="true">On</option>
                    <option value="false">Off</option>
                  </select>
                ) : (
                  <input
                    {...props}
                    type={row.type === 'number' ? 'number' : 'text'}
                    disabled={!canEdit}
                    value={values[row.key] ?? row.value}
                    onChange={(e) => setValues((v) => ({ ...v, [row.key]: e.target.value }))}
                  />
                )
              }
            </FormField>
          ))}
        </div>
      </TableCard>
    </>
  );
}
