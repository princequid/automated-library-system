// backend/src/middleware/rbac.ts
// Role-based access control. requireRole(...roles) returns middleware that rejects
// with 403 if req.user.role is not in the allowed list. A role hierarchy helper
// (requireAtLeast) expresses the common "LIBRARIAN and above" style checks.
//
// Three roles only: STUDENT, LIBRARIAN, ADMINISTRATOR. Per the role-separation spec,
// ADMINISTRATOR does not normally perform day-to-day circulation/fines operations -
// requireLibrarianOrOverride() is the gate for endpoints where ADMINISTRATOR access
// is an exceptional, audited override rather than routine workflow.
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../shared/appError';

// Ascending privilege order. Higher index = more privilege.
const ROLE_ORDER: UserRole[] = ['STUDENT', 'LIBRARIAN', 'ADMINISTRATOR'];

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

// For endpoints STUDENT and LIBRARIAN both already reach normally (e.g. renew,
// where a student may renew their own loan and a librarian any loan - the
// self-vs-staff distinction is enforced deeper in the service, not here): adds
// only the ADMINISTRATOR-override requirement on top of whatever role gate
// already runs before it, without disturbing STUDENT/LIBRARIAN access.
export function requireOverrideIfAdministrator() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user?.role === 'ADMINISTRATOR') {
      const reason = typeof req.body?.override_reason === 'string' ? req.body.override_reason.trim() : '';
      if (!reason) {
        return next(new AppError('Administrator access to this action requires an override_reason', 400));
      }
      req.isOverride = true;
      req.overrideReason = reason;
    }
    next();
  };
}

// Gate for Librarian-owned operational endpoints (circulation, fines) where an
// ADMINISTRATOR may act only as an explicit, audited exception. LIBRARIAN passes
// unconditionally; ADMINISTRATOR must supply a non-empty req.body.override_reason,
// which is stamped onto req for middleware/auditLog.ts to persist. Any other role
// (or a missing/blank reason from an ADMINISTRATOR) is rejected.
export function requireLibrarianOrOverride() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (req.user.role === 'LIBRARIAN') return next();
    if (req.user.role === 'ADMINISTRATOR') {
      const reason = typeof req.body?.override_reason === 'string' ? req.body.override_reason.trim() : '';
      if (!reason) {
        return next(new AppError('Administrator access to this action requires an override_reason', 400));
      }
      req.isOverride = true;
      req.overrideReason = reason;
      return next();
    }
    return next(new AppError('You do not have permission to perform this action', 403));
  };
}
