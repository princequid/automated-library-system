// backend/src/modules/inventory/inventory.controller.ts
import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { sendCreated, sendSuccess } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

export const inventoryController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await inventoryService.list(), 'Inventory sessions');
  },

  async getOne(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await inventoryService.getById(req.params.id), 'Inventory session');
  },

  async start(req: Request, res: Response): Promise<void> {
    const session = await inventoryService.start(req.body, requireUser(req).id);
    res.locals.audit = { entityType: 'InventorySession', entityId: session.id, after: session };
    sendCreated(res, session, 'Inventory session started');
  },

  async scan(req: Request, res: Response): Promise<void> {
    const result = await inventoryService.scan(req.params.id, req.body);
    sendSuccess(res, result, result.matched ? 'Copy matched' : 'No copy found for this barcode');
  },

  async complete(req: Request, res: Response): Promise<void> {
    const report = await inventoryService.complete(req.params.id);
    res.locals.audit = { entityType: 'InventorySession', entityId: req.params.id, after: report };
    sendSuccess(res, report, 'Inventory session completed');
  },

  async markMissingAsLost(req: Request, res: Response): Promise<void> {
    const result = await inventoryService.markMissingAsLost(req.params.id, req.body.copy_ids ?? []);
    res.locals.audit = { entityType: 'InventorySession', entityId: req.params.id, after: result };
    sendSuccess(res, result, 'Missing copies marked lost');
  },
};
