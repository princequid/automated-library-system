// backend/src/modules/maintenance/maintenance.controller.ts
import { Request, Response } from 'express';
import { maintenanceService } from './maintenance.service';
import { sendCreated, sendSuccess } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

export const maintenanceController = {
  async list(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await maintenanceService.list(req.query as never), 'Maintenance tickets');
  },

  async open(req: Request, res: Response): Promise<void> {
    const staff = requireUser(req);
    const ticket = await maintenanceService.open(req.body, staff.id);
    res.locals.audit = { entityType: 'Maintenance', entityId: ticket.id, after: ticket };
    sendCreated(res, ticket, 'Maintenance ticket opened');
  },

  async resolve(req: Request, res: Response): Promise<void> {
    const staff = requireUser(req);
    const ticket = await maintenanceService.resolve(req.params.id, req.body, staff.id);
    res.locals.audit = { entityType: 'Maintenance', entityId: req.params.id, after: ticket };
    sendSuccess(res, ticket, 'Maintenance ticket resolved');
  },
};
