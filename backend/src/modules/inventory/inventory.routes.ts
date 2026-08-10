// backend/src/modules/inventory/inventory.routes.ts
import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { scanSchema, startSessionSchema } from './dto/inventory.dto';

// Physical stocktaking is a Librarian operation the spec explicitly excludes
// Administrator from performing as routine work ("daily inventory scanning") -
// unlike circulation/fines, there is no override path here: Administrator gets
// read-only access (list/detail) and nothing more.
const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /inventory/sessions:
 *   get:
 *     tags: [Inventory]
 *     summary: List stocktake sessions (LIBRARIAN+, Administrator view-only)
 *     responses: { 200: { description: Sessions } }
 *   post:
 *     tags: [Inventory]
 *     summary: Start a stocktake session, optionally scoped to one shelf (LIBRARIAN only)
 *     responses: { 201: { description: Started } }
 */
router.get('/sessions', requireAtLeast('LIBRARIAN'), asyncHandler(inventoryController.list));
router.post('/sessions', requireRole('LIBRARIAN'), validateBody(startSessionSchema), asyncHandler(inventoryController.start));

/**
 * @swagger
 * /inventory/sessions/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Session detail with every scan so far (LIBRARIAN+, Administrator view-only)
 *     responses: { 200: { description: Session detail } }
 */
router.get('/sessions/:id', requireAtLeast('LIBRARIAN'), asyncHandler(inventoryController.getOne));

/**
 * @swagger
 * /inventory/sessions/{id}/scan:
 *   post:
 *     tags: [Inventory]
 *     summary: Record one scanned barcode (LIBRARIAN only)
 *     responses: { 200: { description: Match result } }
 */
router.post('/sessions/:id/scan', requireRole('LIBRARIAN'), validateBody(scanSchema), asyncHandler(inventoryController.scan));

/**
 * @swagger
 * /inventory/sessions/{id}/complete:
 *   put:
 *     tags: [Inventory]
 *     summary: Complete the session and get the discrepancy report (LIBRARIAN only)
 *     responses: { 200: { description: Discrepancy report } }
 */
router.put('/sessions/:id/complete', requireRole('LIBRARIAN'), asyncHandler(inventoryController.complete));

/**
 * @swagger
 * /inventory/sessions/{id}/mark-lost:
 *   put:
 *     tags: [Inventory]
 *     summary: Bulk-mark missing copies from a completed session as LOST (LIBRARIAN only)
 *     responses: { 200: { description: Updated count } }
 */
router.put('/sessions/:id/mark-lost', requireRole('LIBRARIAN'), asyncHandler(inventoryController.markMissingAsLost));

export const inventoryRoutes = router;
