// frontend/src/hooks/api.ts
// One typed data-access layer for the whole app. Query hooks read; mutation hooks
// write and invalidate the relevant caches. Pages consume these and never call
// axios directly.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AppNotification,
  AppUser,
  CatalogItem,
  DashboardStats,
  Eligibility,
  Fine,
  Loan,
  MeProfile,
  Paginated,
  Reservation,
  Setting,
} from '@/lib/types';

// Every endpoint returns { success, data, message }. `d<T>` unwraps `.data.data`.
async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get(url, { params });
  return res.data.data as T;
}
async function getWithMeta<T>(url: string, params?: Record<string, unknown>): Promise<Paginated<T>> {
  const res = await api.get(url, { params });
  return { items: res.data.data as T[], meta: res.data.meta };
}

// ---- Profile / me -----------------------------------------------------------
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => get<MeProfile>('/users/me') });
export const useMyLoans = () => useQuery({ queryKey: ['me', 'loans'], queryFn: () => get<Loan[]>('/users/me/loans') });
export const useMyFines = () => useQuery({ queryKey: ['me', 'fines'], queryFn: () => get<Fine[]>('/fines/me') });
export const useMyReservations = () =>
  useQuery({ queryKey: ['me', 'reservations'], queryFn: () => get<Reservation[]>('/users/me/reservations') });
export const useMyEligibility = () =>
  useQuery({ queryKey: ['me', 'eligibility'], queryFn: () => get<Eligibility>('/users/me/eligibility') });

// ---- Catalog ----------------------------------------------------------------
export const useCatalog = (params: Record<string, unknown>) =>
  useQuery({ queryKey: ['catalog', params], queryFn: () => getWithMeta<CatalogItem>('/catalog/items', params) });
export const useCatalogItem = (id: string | undefined) =>
  useQuery({ queryKey: ['catalog', 'item', id], queryFn: () => get<CatalogItem>(`/catalog/items/${id}`), enabled: !!id });
export const useUserEligibility = (id: string | undefined) =>
  useQuery({ queryKey: ['eligibility', id], queryFn: () => get<Eligibility>(`/users/${id}/eligibility`), enabled: !!id });

// ---- Circulation (mutations) ------------------------------------------------
export function useRenewLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (loanId: string) => api.post('/circulation/renew', { loan_id: loanId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
export function useIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { copy_id: string; user_id: string }) => api.post('/circulation/issue', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  });
}
export function useReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (barcode: string) => api.post('/circulation/return', { barcode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog'] });
      qc.invalidateQueries({ queryKey: ['reshelf'] });
    },
  });
}
export const useReshelf = () => useQuery({ queryKey: ['reshelf'], queryFn: () => get<ReshelfRow[]>('/circulation/reshelf') });
export interface ReshelfRow {
  loan_id: string;
  barcode: string;
  title: string;
  author: string;
  shelf_location: string;
  returned_at: string | null;
}

// ---- Reservations -----------------------------------------------------------
export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (catalogItemId: string) => api.post('/reservations', { catalog_item_id: catalogItemId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'reservations'] }),
  });
}
export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reservations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'reservations'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}
export const useReservations = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['reservations', params], queryFn: () => get<Reservation[]>('/reservations', params) });

// ---- Fines ------------------------------------------------------------------
export function usePayFines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fineIds: string[]) => api.post('/fines/pay', { fine_ids: fineIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
export const useFines = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['fines', params], queryFn: () => get<Fine[]>('/fines', params) });
export function useWaiveFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; reason: string }) =>
      api.put(`/fines/${payload.id}/waive`, { reason: payload.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fines'] }),
  });
}
export function useDisputeFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; reason: string }) =>
      api.post(`/fines/${payload.id}/dispute`, { reason: payload.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'fines'] }),
  });
}

// ---- Notifications ------------------------------------------------------------
export const useMyNotifications = () =>
  useQuery({
    queryKey: ['me', 'notifications'],
    queryFn: () => get<AppNotification[]>('/notifications/me'),
    refetchInterval: 30_000,
  });
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'notifications'] }),
  });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'notifications'] }),
  });
}

// ---- Users (admin) ----------------------------------------------------------
export const useUsers = (params: Record<string, unknown>) =>
  useQuery({ queryKey: ['users', params], queryFn: () => getWithMeta<AppUser>('/users', params) });
export const useUserLoans = (id: string | undefined) =>
  useQuery({ queryKey: ['users', id, 'loans'], queryFn: () => get<Loan[]>(`/users/${id}/loans`), enabled: !!id });
export const useUserFines = (id: string | undefined) =>
  useQuery({ queryKey: ['users', id, 'fines'], queryFn: () => get<Fine[]>(`/users/${id}/fines`), enabled: !!id });
export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; status: string; reason: string }) =>
      api.put(`/users/${payload.id}/status`, { status: payload.status, reason: payload.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/users', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// ---- Analytics --------------------------------------------------------------
export const useDashboardStats = () =>
  useQuery({ queryKey: ['analytics', 'dashboard'], queryFn: () => get<DashboardStats>('/analytics/dashboard-stats') });
export const useLoanVolume = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['analytics', 'loan-volume', params], queryFn: () => get<{ day: string; count: number }[]>('/analytics/loan-volume', params) });
export const useTopBorrowed = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['analytics', 'top-borrowed', params], queryFn: () => get<{ title: string; author: string; count: number }[]>('/analytics/top-borrowed', params) });
export const useBorrowingByDept = () =>
  useQuery({ queryKey: ['analytics', 'by-dept'], queryFn: () => get<{ department: string; count: number }[]>('/analytics/borrowing-by-dept') });
export const useOverdueRate = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['analytics', 'overdue-rate', params], queryFn: () => get<{ day: string; rate: number }[]>('/analytics/overdue-rate', params) });
export const useRecentActivity = () =>
  useQuery({ queryKey: ['analytics', 'recent'], queryFn: () => get<Loan[]>('/analytics/recent-activity') });

// ---- Settings ---------------------------------------------------------------
export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: () => get<Setting[]>('/settings') });
export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { key: string; value: string | number | boolean }[]) =>
      api.put('/settings', { updates }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
