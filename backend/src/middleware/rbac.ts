// backend/src/middleware/rbac.ts
// Role-based access control. requireRole(...roles) returns middleware that rejects
// with 403 if req.user.role is not in the allowed list. A role hierarchy helper
// (requireAtLeast) expresses the common "LIBRARIAN and above" style checks.
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../shared/appError';

// Ascending privilege order. Higher index = more privilege.
const ROLE_ORDER: UserRole[] = ['STUDENT', 'DESK_STAFF', 'LIBRARIAN', 'SENIOR_LIBRARIAN', 'SUPER_ADMIN'];

export function rank(role: UserRole): number {
  return ROLE_ORDER.indexOf(role);
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
}

// Allows the given role and every role above it in the hierarchy.
export function requireAtLeast(minimum: UserRole) {
  const allowed = ROLE_ORDER.slice(rank(minimum));
  return requireRole(...allowed);
}
