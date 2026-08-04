// backend/src/modules/fines/fines.service.ts
// Fines: listing, manual entry (damaged/lost), waiving, and student payment.
// Eligibility always reads live fine totals, so paying/waiving a fine takes effect
// on the borrower's next eligibility check with no extra bookkeeping here.
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/appError';
import { CreateFineDto, ListFinesQuery, PayFinesDto } from './dto/fine.dto';

const fineInclude = {
  user: { select: { id: true, name: true, email: true, student_id: true } },
  loan: { select: { id: true, copy_id: true } },
};

class FinesService {
  async list(query: ListFinesQuery) {
    const where: Prisma.FineWhereInput = {};
    if (query.paid !== undefined) where.paid = query.paid;
    if (query.waived !== undefined) where.waived = query.waived;
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
    return prisma.fine.update({
      where: { id: fineId },
      data: { waived: true, waived_by: waivedBy, reason: `${fine.reason} (waived: ${reason})` },
      include: fineInclude,
    });
  }

  /**
   * Student pays one or more of their OWN fines.
   * TODO: verify via Stripe or Paystack webhook before marking paid in production.
   * The current implementation trusts the client, which is fine for a demo/dev
   * build but MUST be gated behind a verified payment webhook before real money
   * moves. Eligibility recalculates automatically afterwards - it always reads
   * live fine totals, so no extra code is needed here to "unblock" the account.
   */
  async pay(userId: string, dto: PayFinesDto) {
    const fines = await prisma.fine.findMany({ where: { id: { in: dto.fine_ids } } });

    // A student may only pay their own, unpaid, un-waived fines.
    const notOwned = fines.find((f) => f.user_id !== userId);
    if (notOwned) throw new AppError('You can only pay your own fines', 403);
    const alreadyResolved = fines.find((f) => f.paid || f.waived);
    if (alreadyResolved) throw new AppError('One or more fines are already paid or waived', 400);

    const reference = dto.payment_reference ?? `PAY-${Date.now()}`;
    await prisma.fine.updateMany({
      where: { id: { in: dto.fine_ids }, user_id: userId, paid: false, waived: false },
      data: { paid: true, paid_at: new Date(), payment_reference: reference },
    });

    const total = fines.reduce((sum, f) => sum + Number(f.amount), 0);
    return { paidCount: fines.length, total, payment_reference: reference };
  }
}

export const finesService = new FinesService();
