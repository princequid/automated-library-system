// frontend/src/hooks/useAuth.ts
// Auth actions: login, logout, change password. Wraps the API and the Zustand store.
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/store/auth.store';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await api.post('/auth/login', credentials);
      return res.data.data as LoginResponse;
    },
    onSuccess: (data) => login(data.user, data.accessToken),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    // Clear local state regardless of the network result.
    onSettled: () => logout(),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', payload),
  });
}
