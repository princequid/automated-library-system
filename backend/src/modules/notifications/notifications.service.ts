// backend/src/modules/notifications/notifications.service.ts
// The one call site every event trigger uses: writes an in-app Notification row
// AND sends an email (src/shared/email.ts - a real SMTP send if configured,
// otherwise the existing console-log stub, so this never throws or blocks the
// caller regardless of whether email is set up).
import { prisma } from '../../config/database';
import { sendEmail } from '../../shared/email';
import { logger } from '../../config/logger';

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}

class NotificationsService {
  async notify(input: NotifyInput): Promise<void> {
    const [notification, user] = await Promise.all([
      prisma.notification.create({
        data: {
          user_id: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          entity_type: input.entityType,
          entity_id: input.entityId,
        },
      }),
      prisma.user.findUnique({ where: { id: input.userId }, select: { email: true, name: true } }),
    ]);

    if (!user) return;

    // Fire-and-forget - a slow/failed email must never fail the caller's own
    // action (a return, a waive, a fine post, etc).
    sendEmail(user.email, input.title, `Hi ${user.name},\n\n${input.body}\n\nUniversity Library`).catch((err) =>
      logger.error(`Failed to send notification email to ${user.email}: ${(err as Error).message}`)
    );

    void notification;
  }

  async listForUser(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: { user_id: userId, ...(unreadOnly ? { read_at: null } : {}) },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.user_id !== userId) return null;
    return prisma.notification.update({ where: { id }, data: { read_at: new Date() } });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { user_id: userId, read_at: null },
      data: { read_at: new Date() },
    });
    return result.count;
  }
}

export const notificationsService = new NotificationsService();
