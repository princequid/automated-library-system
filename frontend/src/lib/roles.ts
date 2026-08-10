// frontend/src/lib/roles.ts
// Client-side role hierarchy used only to show/hide controls. The backend's RBAC is
// the real boundary - hiding a button never grants or denies access on its own.
import type { UserRole } from '@/store/auth.store';

const ORDER: UserRole[] = ['STUDENT', 'LIBRARIAN', 'ADMINISTRATOR'];

export function rankAtLeast(role: UserRole | undefined | null, minimum: UserRole): boolean {
  if (!role) return false;
  return ORDER.indexOf(role) >= ORDER.indexOf(minimum);
}
