// frontend/src/lib/api.ts
// Axios instance. Attaches the in-memory access token to every request and, on a
// 401, transparently attempts ONE refresh via the httpOnly cookie before retrying
// the original request. If refresh fails, the session is cleared and the user is
// sent to /login.
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive the refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request: attach bearer token ------------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Response: silent single-flight refresh on 401 --------------------------
let refreshing: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const token = res.data?.data?.accessToken as string | undefined;
    const user = res.data?.data?.user;
    if (token) {
      useAuthStore.getState().updateToken(token);
      if (user) useAuthStore.getState().setUser(user);
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    // Do not try to refresh the refresh/login calls themselves.
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing = refreshing ?? performRefresh();
      const token = await refreshing;
      refreshing = null;

      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      }

      // Refresh failed - clear session and bounce to login.
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

/** Normalise an axios error into a user-facing message from the API's error shape. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error ?? data?.message ?? err.message ?? fallback;
  }
  return fallback;
}

/** Unwrap the standard { success, data } envelope. */
export function unwrap<T>(payload: { data: T }): T {
  return payload.data;
}
