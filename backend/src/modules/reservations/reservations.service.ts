// backend/src/modules/reservations/reservations.service.ts
// Holds queue. Exports promoteQueue, called by circulation's return flow and by the
// hold-expiry job to advance the next person in line automatically.
import { addDays } from 'date-fns';
import { prisma } from '../../config/database';
import { settingsService } from '../settings/settings.service';
import { checkEligibility } from '../users/eligibility';
import { notificationsService } from '../notifications/notifications.service';
import { AppError } from '../../shared/appError';

const reservationInclude = {
  catalog_item: { select: { id: true, title: true, author: true, available_copies: true } },
  user: { select: { id: true, name: true, email: true, student_id: true } },
};

/**
 * Promote the next WAITING reservation for an item to READY: set ready_at, an
 * expiry deadline from settings, and flip one AVAILABLE copy to RESERVED. If there
 * is no one waiting, leave copies AVAILABLE. Safe to call whenever a copy frees up.
 */
export async function promoteQueue(catalogItemId: string): Promise<void> {
  const next = await prisma.reservation.findFirst({
    where: { catalog_item_id: catalogItemId, status: 'WAITING' },
    orderBy: { queue_position: 'asc' },
  });
  if (!next) return; // nobody waiting - copy stays AVAILABLE

  const availableCopy = await prisma.copy.findFirst({
    where: { catalog_item_id: catalogItemId, status: 'AVAILABLE' },
  });
  if (!availableCopy) return; // nothing to reserve yet

  const deadlineDays = await settingsService.getNumber('hold_pickup_deadline_days');
  const now = new Date();
  const expiresAt = addDays(now, deadlineDays);

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: next.id },
      data: { status: 'READY', ready_at: now, expires_at: expiresAt },
    });
    await tx.copy.update({ where: { id: availableCopy.id }, data: { status: 'RESERVED' } });
    await tx.catalogItem.update({
      where: { id: catalogItemId },
      data: { available_copies: { decrement: 1 } },
    });
  });

  // The exact "reservation ready" gap the checklist audit flagged - previously
  // a student only found out by checking the app themselves.
  const item = await prisma.catalogItem.findUnique({ where: { id: catalogItemId }, select: { title: true } });
  await notificationsService.notify({
    userId: next.user_id,
    type: 'hold_ready',
    title: `"${item?.title ?? 'Your reservation'}" is ready for pickup`,
    body: `Pick it up by ${expiresAt.toDateString()} or the hold expires and passes to the next member in line.`,
    entityType: 'Reservation',
    entityId: next.id,
  });
}

class ReservationsService {
  async create(userId: string, catalogItemId: string) {
    const item = await prisma.catalogItem.findUnique({ where: { id: catalogItemId } });
    if (!item || item.deleted_at) throw new AppError('Catalog item not found', 404);

    if (item.available_copies > 0) {
      throw new AppError('Copies are available - please borrow instead of reserving', 400);
    }

    const existing = await prisma.reservation.findFirst({
      where: { catalog_item_id: catalogItemId, user_id: userId, status: { in: ['WAITING', 'READY'] } },
    });
    if (existing) throw new AppError('You already have an active reservation on this title', 400);

    const eligibility = await checkEligibility(userId);
    if (!eligibility.eligible) throw new AppError(eligibility.reason ?? 'Not eligible to reserve', 422);

    const queueLength = await prisma.reservation.count({
      where: { catalog_item_id: catalogItemId, status: 'WAITING' },
    });

    return prisma.reservation.create({
      data: { catalog_item_id: catalogItemId, user_id: userId, queue_position: queueLength + 1 },
      include: reservationInclude,
    });
  }

  async list(filters: { catalog_item_id?: string; status?: string }) {
    return prisma.reservation.findMany({
      where: {
        catalog_item_id: filters.catalog_item_id,
        status: filters.status as never,
      },
      include: reservationInclude,
      orderBy: [{ catalog_item_id: 'asc' }, { queue_position: 'asc' }],
    });
  }

  async listForUser(userId: string) {
    return prisma.reservation.findMany({
      where: { user_id: userId, status: { in: ['WAITING', 'READY'] } },
      include: reservationInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  /** Cancel and compact the queue positions of everyone behind the cancelled hold. */
  async cancel(reservationId: string, requester: { id: string; role: string }) {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new AppError('Reservation not found', 404);

    // Reservation management is a Librarian operation the spec gives
    // Administrator view-only access to (no override path) - only the owning
    // student or a LIBRARIAN may cancel.
    const isOwner = reservation.user_id === requester.id;
    const isStaff = requester.role === 'LIBRARIAN';
    if (!isOwner && !isStaff) throw new AppError('You cannot cancel this reservation', 403);

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } });
      // Compact positions for anyone still waiting behind it.
      await tx.reservation.updateMany({
        where: {
          catalog_item_id: reservation.catalog_item_id,
          status: 'WAITING',
          queue_position: { gt: reservation.queue_position },
        },
        data: { queue_position: { decrement: 1 } },
      });
    });
  }
}

export const reservationsService = new ReservationsService();
