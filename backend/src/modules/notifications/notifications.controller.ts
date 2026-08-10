// backend/src/modules/notifications/notifications.controller.ts
import { Request, Response } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

export const notificationsController = {
  async myNotifications(req: Request, res: Response): Promise<void> {
    const unreadOnly = req.query.unread_only === 'true';
    sendSuccess(res, await notificationsService.listForUser(requireUser(req).id, unreadOnly), 'Your notifications');
  },

  async markRead(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const updated = await notificationsService.markRead(req.params.id, user.id);
    if (!updated) throw new AppError('Notification not found', 404);
    sendSuccess(res, updated, 'Marked as read');
  },

  async markAllRead(req: Request, res: Response): Promise<void> {
    const count = await notificationsService.markAllRead(requireUser(req).id);
    sendSuccess(res, { count }, 'All notifications marked as read');
  },
};
