// backend/src/modules/fines/fines.service.ts
// Fines: listing, manual entry (damaged/lost), waiving, and student payment.
// Eligibility always reads live fine totals, so paying/waiving a fine takes effect
// on the borrower's next eligibility check with no extra bookkeeping here.
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/appError';
import { notificationsService } from '../notifications/notifications.service';
import { CreateFineDto, DisputeFineDto, ListFinesQuery, PayFinesDto } from './dto/fine.dto';

const fineInclude = {
  user: { select: { id: true, name: true, email: true, student_id: true } },
  loan: { select: { id: true, copy_id: true } },
};

class FinesService {
  async list(query: ListFinesQuery) {
    const where: Prisma.FineWhereInput = {};
    if (query.paid !== undefined) where.paid = query.paid;
    if (query.waived !== undefined) where.waived = query.waived;
    if (query.disputed !== undefined) where.disputed = query.disputed;
    if (query.user_id) where.user_id = query.user_id;
    return prisma.fine.findMany({ where, include: fineInclude, orderBy: { created_at: 'desc' } });
  }

  async listForUser(userId: string) {
    return prisma.fine.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
  }

  /** Manual fine entry, e.g. damaged or lost book. */
  async createManual(dto: CreateFineDto) {
    const user = await prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!user) throw new AppError('User not found', 404);
    return prisma.fine.create({
      data: {
        user_id: dto.user_id,
        loan_id: dto.loan_id,
        amount: new Prisma.Decimal(dto.amount.toFixed(2)),
        reason: dto.reason,
      },
      include: fineInclude,
    });
  }

  async waive(fineId: string, reason: string, waivedBy: string) {
    const fine = await prisma.fine.findUnique({ where: { id: fineId } });
    if (!fine) throw new AppError('Fine not found', 404);
    if (fine.paid) throw new AppError('This fine has already been paid', 400);
    if (fine.waived) throw new AppError('This fine has already been waived', 400);
    const updated = await prisma.fine.update({
      where: { id: fineId },
      data: {
        waived: true,
        waived_by: waivedBy,
        reason: `${fine.reason} (waived: ${reason})`,
        // Waiving resolves any open dispute too - there's nothing left to dispute.
        disputed: false,
        dispute_resolved_at: fine.disputed ? new Date() : fine.dispute_resolved_at,
      },
      include: fineInclude,
    });
    await notificationsService.notify({
      userId: fine.user_id,
      type: 'fine_waived',
      title: 'A fine on your account was waived',
      body: `GHS ${Number(fine.amount).toFixed(2)} for "${fine.reason}" has been waived.`,
      entityType: 'Fine',
      entityId: fine.id,
    });
    return updated;
  }

  /** Student disputes one of their own, unresolved fines. */
  async dispute(fineId: string, userId: string, dto: DisputeFineDto) {
    const fine = await prisma.fine.findUnique({ where: { id: fineId } });
    if (!fine) throw new AppError('Fine not found', 404);
    if (fine.user_id !== userId) throw new AppError('You can only dispute your own fines', 403);
    if (fine.paid || fine.waived) throw new AppError('This fine is already resolved', 400);
    if (fine.disputed) throw new AppError('This fine is already under dispute', 400);
    return prisma.fine.update({
      where: { id: fineId },
      data: { disputed: true, dispute_reason: dto.reason },
      include: fineInclude,
    });
  }

  /** LIBRARIAN (or ADMINISTRATOR via override) resolves a dispute: either waive it, or reject and let the fine stand. */
  async resolveDispute(fineId: string, resolution: 'waive' | 'reject', staffId: string, reason: string) {
    const fine = await prisma.fine.findUnique({ where: { id: fineId } });
    if (!fine) throw new AppError('Fine not found', 404);
    if (!fine.disputed) throw new AppError('This fine is not under dispute', 400);

    if (resolution === 'waive') return this.waive(fineId, reason, staffId);

    const updated = await prisma.fine.update({
      where: { id: fineId },
      data: { disputed: false, dispute_resolved_at: new Date() },
      include: fineInclude,
    });
    await notificationsService.notify({
      userId: fine.user_id,
      type: 'dispute_rejected',
      title: 'Your fine dispute was reviewed',
      body: `Your dispute on "${fine.reason}" was reviewed and the fine stands. Reason: ${reason}`,
      entityType: 'Fine',
      entityId: fine.id,
    });
    return updated;
  }

  /**
   * Student pays one or more of their OWN fines. No real payment gateway is
   * wired in - the reference is ALWAYS server-generated (never the client's),
   * so this is an honest simulation rather than something that only looks
   * secure. Eligibility recalculates automatically afterwards - it always
   * reads live fine totals, so no extra code is needed here to "unblock" the
   * account.
   */
  async pay(userId: string, dto: PayFinesDto) {
    const fines = await prisma.fine.findMany({ where: { id: { in: dto.fine_ids } } });

    // A student may only pay their own, unpaid, un-waived fines.
    const notOwned = fines.find((f) => f.user_id !== userId);
    if (notOwned) throw new AppError('You can only pay your own fines', 403);
    const alreadyResolved = fines.find((f) => f.paid || f.waived);
    if (alreadyResolved) throw new AppError('One or more fines are already paid or waived', 400);

    const reference = `MOCK-${randomUUID()}`;
    await prisma.fine.updateMany({
      where: { id: { in: dto.fine_ids }, user_id: userId, paid: false, waived: false },
      data: { paid: true, paid_at: new Date(), payment_reference: reference, payment_method: 'MOCK' },
    });

    const total = fines.reduce((sum, f) => sum + Number(f.amount), 0);
    return { paidCount: fines.length, total, payment_reference: reference, payment_method: 'MOCK' as const };
  }

  /** Staff records a cash/offline payment on a student's behalf - the admin-side counterpart to pay(). */
  async payManual(fineId: string, staffId: string) {
    const fine = await prisma.fine.findUnique({ where: { id: fineId } });
    if (!fine) throw new AppError('Fine not found', 404);
    if (fine.paid) throw new AppError('This fine has already been paid', 400);
    if (fine.waived) throw new AppError('This fine has already been waived', 400);
    return prisma.fine.update({
      where: { id: fineId },
      data: {
        paid: true,
        paid_at: new Date(),
        payment_method: 'MANUAL',
        payment_reference: `MANUAL-${staffId}-${Date.now()}`,
      },
      include: fineInclude,
    });
  }
}

export const finesService = new FinesService();
