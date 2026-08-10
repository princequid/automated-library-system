// backend/src/modules/fines/fines.routes.ts
import { Router } from 'express';
import { finesController } from './fines.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireLibrarianOrOverride, requireRole } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import {
  createFineSchema,
  disputeFineSchema,
  listFinesQuery,
  payFinesSchema,
  resolveDisputeSchema,
  waiveFineSchema,
} from './dto/fine.dto';

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
 *     summary: Manually create a fine, e.g. damaged/lost book (LIBRARIAN normal; ADMINISTRATOR override only, requires override_reason)
 *     responses: { 201: { description: Created } }
 */
router.get('/', requireAtLeast('LIBRARIAN'), validateQuery(listFinesQuery), asyncHandler(finesController.list));
router.post('/', requireLibrarianOrOverride(), validateBody(createFineSchema), asyncHandler(finesController.create));

/**
 * @swagger
 * /fines/{id}/waive:
 *   put:
 *     tags: [Fines]
 *     summary: Waive a fine with a required reason (LIBRARIAN normal; ADMINISTRATOR override only, also requires override_reason)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Waived }
 *       422: { description: Reason missing }
 */
router.put('/:id/waive', requireLibrarianOrOverride(), validateBody(waiveFineSchema), asyncHandler(finesController.waive));

/**
 * @swagger
 * /fines/{id}/dispute:
 *   post:
 *     tags: [Fines]
 *     summary: Dispute one of your own unresolved fines (STUDENT)
 *     responses: { 200: { description: Dispute submitted } }
 */
router.post('/:id/dispute', requireRole('STUDENT'), validateBody(disputeFineSchema), asyncHandler(finesController.dispute));

/**
 * @swagger
 * /fines/{id}/resolve-dispute:
 *   put:
 *     tags: [Fines]
 *     summary: Resolve a disputed fine - waive it, or reject the dispute (LIBRARIAN normal; ADMINISTRATOR override only, requires override_reason)
 *     responses: { 200: { description: Dispute resolved } }
 */
router.put(
  '/:id/resolve-dispute',
  requireLibrarianOrOverride(),
  validateBody(resolveDisputeSchema),
  asyncHandler(finesController.resolveDispute)
);

/**
 * @swagger
 * /fines/{id}/pay-manual:
 *   post:
 *     tags: [Fines]
 *     summary: Record a cash/offline payment on a student's behalf (LIBRARIAN normal; ADMINISTRATOR override only, requires override_reason)
 *     responses: { 200: { description: Manual payment recorded } }
 */
router.post('/:id/pay-manual', requireLibrarianOrOverride(), asyncHandler(finesController.payManual));

export const finesRoutes = router;
