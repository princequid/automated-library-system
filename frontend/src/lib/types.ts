// frontend/src/lib/types.ts
// Shared API response types mirroring the backend's payloads.
import type { UserRole } from '@/store/auth.store';

export interface Paginated<T> {
  items: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface CatalogItem {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  year: number | null;
  subject_tags: string[];
  abstract: string | null;
  shelf_location: string | null;
  cover_url: string | null;
  available_copies: number;
  total_copies: number;
  loan_period_days?: number;
  copies?: Copy[];
}

export interface Copy {
  id: string;
  catalog_item_id: string;
  barcode: string;
  status: 'AVAILABLE' | 'ON_LOAN' | 'RESERVED' | 'DAMAGED' | 'LOST' | 'WITHDRAWN';
  condition: string | null;
}

export interface Loan {
  id: string;
  copy_id: string;
  user_id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  renewal_count: number;
  issued_by: string;
  copy?: Copy & { catalog_item: CatalogItem };
  user?: { id: string; name: string; email: string; student_id: string | null };
  fines?: Fine[];
}

export interface Reservation {
  id: string;
  catalog_item_id: string;
  user_id: string;
  status: 'WAITING' | 'READY' | 'COLLECTED' | 'EXPIRED' | 'CANCELLED';
  queue_position: number;
  ready_at: string | null;
  expires_at: string | null;
  created_at: string;
  catalog_item?: { id: string; title: string; author: string; available_copies: number };
  user?: { id: string; name: string; email: string; student_id: string | null };
}

export interface Fine {
  id: string;
  loan_id: string | null;
  user_id: string;
  amount: string;
  reason: string;
  paid: boolean;
  paid_at: string | null;
  waived: boolean;
  waived_by: string | null;
  payment_reference: string | null;
  created_at: string;
  user?: { id: string; name: string; email: string; student_id: string | null };
}

export interface Eligibility {
  eligible: boolean;
  reason?: string;
  active_loans: number;
  loan_limit: number;
  outstanding_fines: number;
  blocking_threshold: number;
}

export interface AppUser {
  id: string;
  email: string;
  student_id: string | null;
  name: string;
  department: string | null;
  year_of_study: number | null;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'DELETED';
  created_at?: string;
}

export interface MeProfile extends AppUser {
  activeLoanCount: number;
  outstandingFineTotal: number;
}

export interface DashboardStats {
  activeLoans: number;
  overdueCount: number;
  finesCollectedThisMonth: number;
  itemsAddedThisWeek: number;
}

export interface Setting {
  key: string;
  value: string;
  type: string;
  description: string;
  updated_by: string | null;
  updated_at: string;
}
