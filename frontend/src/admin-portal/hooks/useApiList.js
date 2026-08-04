// src/admin-portal/hooks/useApiList.js
// Thin wrapper over the app's existing @tanstack/react-query (already used by
// src/hooks/useAuth.ts) for the "paginated list" shape every DataTable page
// needs. Returns a status DataTable understands directly ('loading' |
// 'error' | 'success') instead of react-query's own isPending/isError pair,
// and splits the response envelope's `data` (rows) from its `meta`
// (pagination) - see backend/src/shared/responseHelper.ts for why they're
// siblings, never nested.
import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';

export function useApiList(queryKey, listFn, params) {
  const query = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => listFn(params),
    placeholderData: (prev) => prev,
  });

  const envelope = query.data;
  const status = query.isPending ? 'loading' : query.isError ? 'error' : 'success';

  return {
    rows: envelope?.data ?? [],
    meta: envelope?.meta,
    status,
    errorMessage: query.error ? apiErrorMessage(query.error) : undefined,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
