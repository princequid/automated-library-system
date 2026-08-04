// backend/src/modules/reservations/reservations.controller.ts
import { Request, Response } from 'express';
import { reservationsService } from './reservations.service';
import { sendSuccess, sendCreated } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

export const reservationsController = {
  async create(req: Request, res: Response): Promise<void> {
    const student = requireUser(req);
    const reservation = await reservationsService.create(student.id, req.body.catalog_item_id);
    res.locals.audit = { entityType: 'Reservation', entityId: reservation.id, after: reservation };
    sendCreated(res, reservation, `Reserved. You are #${reservation.queue_position} in the queue.`);
  },

  async list(req: Request, res: Response): Promise<void> {
    const reservations = await reservationsService.list(req.query as never);
    sendSuccess(res, reservations, 'Reservations');
  },

  async myReservations(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await reservationsService.listForUser(requireUser(req).id), 'Your reservations');
  },

  async cancel(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    await reservationsService.cancel(req.params.id, user);
    res.locals.audit = { entityType: 'Reservation', entityId: req.params.id };
    sendSuccess(res, null, 'Reservation cancelled');
  },
};
