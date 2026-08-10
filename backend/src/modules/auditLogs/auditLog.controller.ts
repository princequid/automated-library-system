// backend/src/modules/auditLogs/auditLog.controller.ts
import { Request, Response } from 'express';
import { auditLogService } from './auditLog.service';
import { sendSuccess } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

export const auditLogController = {
  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { items, meta } = await auditLogService.list(req.query as never, req.user);
    sendSuccess(res, items, 'Audit log', meta);
  },
};
