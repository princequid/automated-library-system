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
 *     summary: Reserve a title when no copies are available (STUDENT, own)
 *     responses:
 *       201: { description: Reserved with a queue position }
 *       400: { description: Copies available, or duplicate reservation }
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
 *     summary: Cancel a reservation (owner or LIBRARIAN+); compacts the queue
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Cancelled }
 *       403: { description: Not permitted }
 */
router.delete('/:id', asyncHandler(reservationsController.cancel));

export const reservationsRoutes = router;

// Also mounted at /users/me/reservations via the aggregate router.
export const myReservationsHandler = reservationsController.myReservations;
