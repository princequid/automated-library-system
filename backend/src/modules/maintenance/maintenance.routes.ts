// backend/src/modules/maintenance/maintenance.routes.ts
import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireRole } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { listMaintenanceQuery, openMaintenanceSchema, resolveMaintenanceSchema } from './dto/maintenance.dto';

// Lost/damaged-book handling is Librarian's job per the spec; Administrator gets
// read-only visibility (no override path - this isn't in the "exceptional
// override" category, it's flatly excluded from Administrator's normal work).
const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /maintenance:
 *   get:
 *     tags: [Maintenance]
 *     summary: List repair tickets, optionally filtered by status (LIBRARIAN+, Administrator view-only)
 *     parameters: [{ in: query, name: status, schema: { type: string } }]
 *     responses: { 200: { description: Tickets } }
 *   post:
 *     tags: [Maintenance]
 *     summary: Open a repair ticket for a copy - sets the copy to DAMAGED (LIBRARIAN only)
 *     responses: { 201: { description: Created } }
 */
router.get('/', requireAtLeast('LIBRARIAN'), validateQuery(listMaintenanceQuery), asyncHandler(maintenanceController.list));
router.post('/', requireRole('LIBRARIAN'), validateBody(openMaintenanceSchema), asyncHandler(maintenanceController.open));

/**
 * @swagger
 * /maintenance/{id}/resolve:
 *   put:
 *     tags: [Maintenance]
 *     summary: Close a ticket - repaired (copy -> AVAILABLE) or withdrawn (copy -> WITHDRAWN) (LIBRARIAN only)
 *     responses: { 200: { description: Resolved } }
 */
router.put('/:id/resolve', requireRole('LIBRARIAN'), validateBody(resolveMaintenanceSchema), asyncHandler(maintenanceController.resolve));

export const maintenanceRoutes = router;
