// backend/src/shared/types.ts
// Global Express request augmentation. Once auth middleware runs, req.user is the
// decoded access-token payload. res.locals.audit lets controllers attach
// before/after snapshots that the audit middleware persists after the response.
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

export interface AuditSnapshot {
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
    interface Locals {
      audit?: AuditSnapshot;
    }
  }
}

export {};
