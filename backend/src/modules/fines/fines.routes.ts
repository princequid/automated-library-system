// backend/src/modules/fines/fines.routes.ts
import { Router } from 'express';
import { finesController } from './fines.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireRole } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { createFineSchema, listFinesQuery, payFinesSchema, waiveFineSchema } from './dto/fine.dto';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /fines/me:
 *   get:
 *     tags: [Fines]
 *     summary: The current student's own fines
 *     responses: { 200: { description: Your fines } }
 */
router.get('/me', asyncHandler(finesController.myFines));

/**
 * @swagger
 * /fines/pay:
 *   post:
 *     tags: [Fines]
 *     summary: Pay one or more of your own fines (STUDENT)
 *     description: DEV build trusts the client. Production must verify via a payment webhook first.
 *     responses:
 *       200: { description: Payment recorded }
 *       403: { description: Fines not owned by caller }
 */
router.post('/pay', requireRole('STUDENT'), validateBody(payFinesSchema), asyncHandler(finesController.pay));

/**
 * @swagger
 * /fines:
 *   get:
 *     tags: [Fines]
 *     summary: List fines with filters (LIBRARIAN+)
 *     parameters:
 *       - { in: query, name: paid, schema: { type: boolean } }
 *       - { in: query, name: waived, schema: { type: boolean } }
 *       - { in: query, name: user_id, schema: { type: string } }
 *     responses: { 200: { description: Fines } }
 *   post:
 *     tags: [Fines]
 *     summary: Manually create a fine, e.g. damaged/lost book (LIBRARIAN+)
 *     responses: { 201: { description: Created } }
 */
router.get('/', requireAtLeast('LIBRARIAN'), validateQuery(listFinesQuery), asyncHandler(finesController.list));
router.post('/', requireAtLeast('LIBRARIAN'), validateBody(createFineSchema), asyncHandler(finesController.create));

/**
 * @swagger
 * /fines/{id}/waive:
 *   put:
 *     tags: [Fines]
 *     summary: Waive a fine with a required reason (SENIOR_LIBRARIAN+)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Waived }
 *       422: { description: Reason missing }
 */
router.put('/:id/waive', requireAtLeast('SENIOR_LIBRARIAN'), validateBody(waiveFineSchema), asyncHandler(finesController.waive));

export const finesRoutes = router;
