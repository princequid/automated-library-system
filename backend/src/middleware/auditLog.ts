// backend/src/middleware/auditLog.ts
// Runs AFTER the response is sent, only for mutating methods (POST/PUT/PATCH/DELETE)
// that succeeded (2xx). Writes an AuditLog row using req.user.id as actor_id and
// "METHOD path" as the action, capturing whatever before/after snapshot the
// controller attached to res.locals.audit. Services never write audit rows manually.
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AuditSnapshot } from '../shared/types';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function auditLog(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    if (!MUTATING.has(req.method)) return;
    if (res.statusCode >= 400) return; // only record successful mutations
    if (!req.user) return; // unauthenticated mutations (e.g. failed login) are not audited here

    const snapshot = res.locals.audit as AuditSnapshot | undefined;

    // Fire-and-forget; auditing must never block or fail the request that already finished.
    prisma.auditLog
      .create({
        data: {
          actor_id: req.user.id,
          action: `${req.method} ${req.path}`,
          entity_type: snapshot?.entityType ?? 'unknown',
          entity_id: snapshot?.entityId,
          before: (snapshot?.before ?? undefined) as never,
          after: (snapshot?.after ?? undefined) as never,
        },
      })
      .catch((err) => logger.error(`Failed to write audit log: ${(err as Error).message}`));
  });

  next();
}
