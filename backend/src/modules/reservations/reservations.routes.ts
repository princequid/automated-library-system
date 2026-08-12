// backend/src/modules/reservations/reservations.routes.ts
import { Router } from 'express';
import { reservationsController } from './reservations.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireRole } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { createReservationSchema, listReservationsQuery } from './dto/reservation.dto';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Borrow a title (STUDENT, own) - the single borrow entry point. READY immediately if a copy is free (pickup deadline applies), otherwise WAITING in queue.
 *     responses:
 *       201: { description: Created - either READY (pickup deadline set) or WAITING (queued) }
 *       400: { description: Duplicate active request on this title }
 *       422: { description: Ineligible }
 *   get:
 *     tags: [Reservations]
 *     summary: List reservations (LIBRARIAN+)
 *     parameters: [{ in: query, name: catalog_item_id, schema: { type: string } }]
 *     responses: { 200: { description: Reservations } }
 */
router.post('/', requireRole('STUDENT'), validateBody(createReservationSchema), asyncHandler(reservationsController.create));
router.get('/', requireAtLeast('LIBRARIAN'), validateQuery(listReservationsQuery), asyncHandler(reservationsController.list));

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     tags: [Reservations]
 *     summary: Cancel a reservation (owning STUDENT, or LIBRARIAN - Administrator has view-only access, no override); compacts the queue
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Cancelled }
 *       403: { description: Not permitted }
 */
router.delete('/:id', requireRole('STUDENT', 'LIBRARIAN'), asyncHandler(reservationsController.cancel));

export const reservationsRoutes = router;

// Also mounted at /users/me/reservations via the aggregate router.
export const myReservationsHandler = reservationsController.myReservations;
