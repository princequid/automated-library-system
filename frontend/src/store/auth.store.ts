// frontend/src/store/auth.store.ts
// Global auth state. The access token lives in memory ONLY - never localStorage or
// sessionStorage. The refresh token is an httpOnly cookie the browser manages; the
// frontend never reads or writes it.
import { create } from 'zustand';

export type UserRole = 'STUDENT' | 'LIBRARIAN' | 'ADMINISTRATOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  student_id?: string | null;
  department?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  updateToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user, isAuthenticated: true }),
}));

/**
 * True for any staff role (LIBRARIAN or ADMINISTRATOR) - decides Student Portal
 * vs the shared staff shell at /admin. It is NOT an RBAC check: within the staff
 * shell, LIBRARIAN and ADMINISTRATOR see different dashboards/nav/permissions -
 * see AdminIndexRoute and constants/nav.js.
 */
export function isAdminRole(role: UserRole | undefined | null): boolean {
  return !!role && role !== 'STUDENT';
}
