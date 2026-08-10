// backend/src/modules/auditLogs/auditLog.routes.ts
import { Router } from 'express';
import { auditLogController } from './auditLog.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast } from '../../middleware/rbac';
import { validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { listAuditLogsQuery } from './dto/auditLog.dto';

const router = Router();
router.use(authenticate, requireAtLeast('LIBRARIAN'));

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     tags: [AuditLogs]
 *     summary: Sensitive administrative actions, paginated (LIBRARIAN sees only their own actions; ADMINISTRATOR sees everything)
 *     parameters:
 *       - { in: query, name: actor_id, schema: { type: string } }
 *       - { in: query, name: entity_type, schema: { type: string } }
 *       - { in: query, name: action, schema: { type: string } }
 *       - { in: query, name: from, schema: { type: string } }
 *       - { in: query, name: to, schema: { type: string } }
 *     responses: { 200: { description: Audit log entries } }
 */
router.get('/', validateQuery(listAuditLogsQuery), asyncHandler(auditLogController.list));

export const auditLogRoutes = router;
