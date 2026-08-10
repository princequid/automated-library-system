// backend/src/modules/acquisitions/acquisitions.controller.ts
import { Request, Response } from 'express';
import { acquisitionsService } from './acquisitions.service';
import { sendCreated, sendSuccess } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

export const acquisitionsController = {
  async list(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await acquisitionsService.list(req.query as never), 'Acquisition requests');
  },

  async create(req: Request, res: Response): Promise<void> {
    const acquisition = await acquisitionsService.create(req.body, requireUser(req).id);
    res.locals.audit = { entityType: 'Acquisition', entityId: acquisition.id, after: acquisition };
    sendCreated(res, acquisition, 'Acquisition request created');
  },

  async approve(req: Request, res: Response): Promise<void> {
    const acquisition = await acquisitionsService.approve(req.params.id, requireUser(req).id);
    res.locals.audit = { entityType: 'Acquisition', entityId: req.params.id, after: acquisition };
    sendSuccess(res, acquisition, 'Request approved');
  },

  async reject(req: Request, res: Response): Promise<void> {
    const acquisition = await acquisitionsService.reject(req.params.id, requireUser(req).id, req.body.reason);
    res.locals.audit = { entityType: 'Acquisition', entityId: req.params.id, after: acquisition };
    sendSuccess(res, acquisition, 'Request rejected');
  },

  async markOrdered(req: Request, res: Response): Promise<void> {
    const acquisition = await acquisitionsService.markOrdered(req.params.id);
    res.locals.audit = { entityType: 'Acquisition', entityId: req.params.id, after: acquisition };
    sendSuccess(res, acquisition, 'Marked ordered');
  },

  async receive(req: Request, res: Response): Promise<void> {
    const acquisition = await acquisitionsService.receive(req.params.id, req.body, requireUser(req).id);
    res.locals.audit = { entityType: 'Acquisition', entityId: req.params.id, after: acquisition };
    sendSuccess(res, acquisition, 'Received into catalogue');
  },
};
