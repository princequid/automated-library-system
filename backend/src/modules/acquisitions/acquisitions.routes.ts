// backend/src/modules/acquisitions/acquisitions.routes.ts
import { Router } from 'express';
import { acquisitionsController } from './acquisitions.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireRole } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import {
  createAcquisitionSchema,
  listAcquisitionsQuery,
  receiveAcquisitionSchema,
  rejectAcquisitionSchema,
} from './dto/acquisitions.dto';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /acquisitions:
 *   get:
 *     tags: [Acquisitions]
 *     summary: List book requests, optionally filtered by status (LIBRARIAN+, ADMINISTRATOR views to approve/reject)
 *     responses: { 200: { description: Requests } }
 *   post:
 *     tags: [Acquisitions]
 *     summary: Request a book be acquired (LIBRARIAN only - Administrator approves, doesn't request)
 *     responses: { 201: { description: Created } }
 */
router.get('/', requireAtLeast('LIBRARIAN'), validateQuery(listAcquisitionsQuery), asyncHandler(acquisitionsController.list));
router.post('/', requireRole('LIBRARIAN'), validateBody(createAcquisitionSchema), asyncHandler(acquisitionsController.create));

/**
 * @swagger
 * /acquisitions/{id}/approve:
 *   put:
 *     tags: [Acquisitions]
 *     summary: Approve a request (ADMINISTRATOR)
 *     responses: { 200: { description: Approved } }
 */
router.put('/:id/approve', requireRole('ADMINISTRATOR'), asyncHandler(acquisitionsController.approve));

/**
 * @swagger
 * /acquisitions/{id}/reject:
 *   put:
 *     tags: [Acquisitions]
 *     summary: Reject a request with a reason (ADMINISTRATOR)
 *     responses: { 200: { description: Rejected } }
 */
router.put('/:id/reject', requireRole('ADMINISTRATOR'), validateBody(rejectAcquisitionSchema), asyncHandler(acquisitionsController.reject));

/**
 * @swagger
 * /acquisitions/{id}/order:
 *   put:
 *     tags: [Acquisitions]
 *     summary: Mark an approved request as ordered/purchased (LIBRARIAN only - Administrator has view access only)
 *     responses: { 200: { description: Marked ordered } }
 */
router.put('/:id/order', requireRole('LIBRARIAN'), asyncHandler(acquisitionsController.markOrdered));

/**
 * @swagger
 * /acquisitions/{id}/receive:
 *   put:
 *     tags: [Acquisitions]
 *     summary: The book arrived - catalogue it and create its copies (LIBRARIAN only - Administrator has view access only)
 *     responses: { 200: { description: Received into catalogue } }
 */
router.put('/:id/receive', requireRole('LIBRARIAN'), validateBody(receiveAcquisitionSchema), asyncHandler(acquisitionsController.receive));

export const acquisitionsRoutes = router;
