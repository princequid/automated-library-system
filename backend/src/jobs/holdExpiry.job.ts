// backend/src/jobs/holdExpiry.job.ts
// Every 30 minutes ('*/30 * * * *'): expire READY holds past their pickup deadline,
// return the copy to AVAILABLE, and promote the next person in the queue.
import { prisma } from '../config/database';
import { promoteQueue } from '../modules/reservations/reservations.service';
import { updateAvailableCopies } from '../modules/catalog/catalog.service';
import { notificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../config/logger';

export async function runHoldExpiry(): Promise<void> {
  const now = new Date();
  const expired = await prisma.reservation.findMany({
    where: { status: 'READY', expires_at: { lt: now } },
    include: { catalog_item: { select: { title: true } } },
  });
  if (expired.length === 0) return;

  for (const reservation of expired) {
    await prisma.reservation.update({ where: { id: reservation.id }, data: { status: 'EXPIRED' } });
    await notificationsService.notify({
      userId: reservation.user_id,
      type: 'hold_expired',
      title: `Your hold on "${reservation.catalog_item.title}" has expired`,
      body: "It wasn't picked up in time and has passed to the next member in line. You can reserve it again if it's still unavailable.",
      entityType: 'Reservation',
      entityId: reservation.id,
    });

    // Free the RESERVED copy for this item back to AVAILABLE.
    const reservedCopy = await prisma.copy.findFirst({
      where: { catalog_item_id: reservation.catalog_item_id, status: 'RESERVED' },
    });
    if (reservedCopy) {
      await prisma.copy.update({ where: { id: reservedCopy.id }, data: { status: 'AVAILABLE' } });
      await updateAvailableCopies(reservation.catalog_item_id);
    }

    // Advance the queue so the next member gets promoted automatically.
    await promoteQueue(reservation.catalog_item_id);
  }

  logger.info(`[job:holdExpiry] expired ${expired.length} hold(s) and promoted the next in line.`);
}
