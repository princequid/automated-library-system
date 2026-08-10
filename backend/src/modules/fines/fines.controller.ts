// backend/src/modules/fines/fines.controller.ts
import { Request, Response } from 'express';
import { finesService } from './fines.service';
import { sendSuccess, sendCreated } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

export const finesController = {
  async list(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await finesService.list(req.query as never), 'Fines');
  },

  async myFines(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await finesService.listForUser(requireUser(req).id), 'Your fines');
  },

  async create(req: Request, res: Response): Promise<void> {
    const fine = await finesService.createManual(req.body);
    res.locals.audit = { entityType: 'Fine', entityId: fine.id, after: fine };
    sendCreated(res, fine, 'Fine created');
  },

  async waive(req: Request, res: Response): Promise<void> {
    const staff = requireUser(req);
    const fine = await finesService.waive(req.params.id, req.body.reason, staff.id);
    res.locals.audit = { entityType: 'Fine', entityId: req.params.id, after: fine };
    sendSuccess(res, fine, 'Fine waived');
  },

  async pay(req: Request, res: Response): Promise<void> {
    const student = requireUser(req);
    const result = await finesService.pay(student.id, req.body);
    res.locals.audit = { entityType: 'Fine', after: result };
    sendSuccess(res, result, 'Payment recorded (simulated - no real gateway is connected)');
  },

  async payManual(req: Request, res: Response): Promise<void> {
    const staff = requireUser(req);
    const fine = await finesService.payManual(req.params.id, staff.id);
    res.locals.audit = { entityType: 'Fine', entityId: req.params.id, after: fine };
    sendSuccess(res, fine, 'Manual payment recorded');
  },

  async dispute(req: Request, res: Response): Promise<void> {
    const student = requireUser(req);
    const fine = await finesService.dispute(req.params.id, student.id, req.body);
    res.locals.audit = { entityType: 'Fine', entityId: req.params.id, after: fine };
    sendSuccess(res, fine, 'Dispute submitted');
  },

  async resolveDispute(req: Request, res: Response): Promise<void> {
    const staff = requireUser(req);
    const fine = await finesService.resolveDispute(req.params.id, req.body.resolution, staff.id, req.body.reason);
    res.locals.audit = { entityType: 'Fine', entityId: req.params.id, after: fine };
    sendSuccess(res, fine, 'Dispute resolved');
  },
};
