// backend/src/modules/circulation/circulation.routes.ts
import { Router } from 'express';
import { circulationController } from './circulation.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireLibrarianOrOverride, requireOverrideIfAdministrator } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { issueSchema, loansQuery, renewSchema, returnSchema } from './dto/circulation.dto';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /circulation/issue:
 *   post:
 *     tags: [Circulation]
 *     summary: Desk-issue a book to a member (LIBRARIAN normal; ADMINISTRATOR override only, requires override_reason)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, required: [copy_id, user_id], properties: { copy_id: { type: string }, user_id: { type: string }, override_reason: { type: string } } }
 *     responses:
 *       201: { description: Loan created }
 *       400: { description: Administrator override missing override_reason }
 *       422: { description: Ineligible or copy unavailable }
 */
router.post('/issue', requireLibrarianOrOverride(), validateBody(issueSchema), asyncHandler(circulationController.issue));

/**
 * @swagger
 * /circulation/return:
 *   post:
 *     tags: [Circulation]
 *     summary: Return a book by barcode (LIBRARIAN normal; ADMINISTRATOR override only, requires override_reason). Creates an overdue fine if late.
 *     responses:
 *       200: { description: Returned; body includes { loan, fine } }
 *       400: { description: Administrator override missing override_reason }
 *       404: { description: No active loan for barcode }
 */
router.post('/return', requireLibrarianOrOverride(), validateBody(returnSchema), asyncHandler(circulationController.returnBook));

/**
 * @swagger
 * /circulation/renew:
 *   post:
 *     tags: [Circulation]
 *     summary: Renew a loan (LIBRARIAN or the loan's own STUDENT normally; ADMINISTRATOR requires override_reason)
 *     responses:
 *       200: { description: Renewed }
 *       400: { description: Already returned, max renewals reached, reservation conflict, or Administrator override missing override_reason }
 */
router.post(
  '/renew',
  requireAtLeast('STUDENT'),
  requireOverrideIfAdministrator(),
  validateBody(renewSchema),
  asyncHandler(circulationController.renew)
);

/**
 * @swagger
 * /circulation/loans:
 *   get:
 *     tags: [Circulation]
 *     summary: List loans with filters (LIBRARIAN+)
 *     parameters:
 *       - { in: query, name: overdue, schema: { type: boolean } }
 *       - { in: query, name: user_id, schema: { type: string } }
 *     responses: { 200: { description: Paginated loans } }
 */
router.get('/loans', requireAtLeast('LIBRARIAN'), validateQuery(loansQuery), asyncHandler(circulationController.listLoans));

/**
 * @swagger
 * /circulation/reshelf:
 *   get:
 *     tags: [Circulation]
 *     summary: Copies returned today, ordered by shelf location (LIBRARIAN+)
 *     responses: { 200: { description: Reshelf list } }
 */
router.get('/reshelf', requireAtLeast('LIBRARIAN'), asyncHandler(circulationController.reshelf));

export const circulationRoutes = router;
