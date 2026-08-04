// backend/src/modules/circulation/circulation.service.ts
// The circulation engine. Serves BOTH the Admin Portal's desk (issue/return/renew)
// AND the Student Portal's self-borrow button. Reuses the shared eligibility rules,
// the settings singleton, updateAvailableCopies (catalog), and promoteQueue
// (reservations) so availability, fines, and holds all stay consistent.
import { addDays, differenceInCalendarDays } from 'date-fns';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { settingsService } from '../settings/settings.service';
import { checkEligibility } from './eligibility.service';
import { updateAvailableCopies } from '../catalog/catalog.service';
import { promoteQueue } from '../reservations/reservations.service';
import { AppError } from '../../shared/appError';
import { buildMeta } from '../../shared/responseHelper';
import { LoansQuery } from './dto/circulation.dto';

const loanInclude = {
  copy: { include: { catalog_item: true } },
  user: { select: { id: true, name: true, email: true, student_id: true } },
} satisfies Prisma.LoanInclude;

class CirculationService {
  /** Core loan creation shared by desk-issue and self-borrow. */
  private async createLoan(copyId: string, userId: string, issuedBy: string) {
    // Full eligibility gate.
    const eligibility = await checkEligibility(userId);
    if (!eligibility.eligible) {
      throw new AppError(eligibility.reason ?? 'Not eligible to borrow', 422);
    }

    const copy = await prisma.copy.findUnique({ where: { id: copyId } });
    if (!copy) throw new AppError('Copy not found', 404);
    if (copy.status !== 'AVAILABLE') {
      throw new AppError('This copy is not available for loan', 422);
    }

    const loanPeriodDays = await settingsService.getNumber('loan_period_days');
    const dueDate = addDays(new Date(), loanPeriodDays);

    const loan = await prisma.$transaction(async (tx) => {
      const created = await tx.loan.create({
        data: { copy_id: copyId, user_id: userId, due_date: dueDate, issued_by: issuedBy },
      });
      await tx.copy.update({ where: { id: copyId }, data: { status: 'ON_LOAN' } });
      return created;
    });

    await updateAvailableCopies(copy.catalog_item_id);

    return prisma.loan.findUnique({ where: { id: loan.id }, include: loanInclude });
  }

  async issue(copyId: string, userId: string, issuedBy: string) {
    return this.createLoan(copyId, userId, issuedBy);
  }

  /** Student self-service borrow. Gated by the self_service_borrowing_enabled setting. */
  async selfBorrow(copyId: string, userId: string) {
    const enabled = await settingsService.getBoolean('self_service_borrowing_enabled');
    if (!enabled) {
      throw new AppError(
        'Self-service borrowing is currently disabled. Please visit the circulation desk.',
        403
      );
    }
    return this.createLoan(copyId, userId, 'self-service');
  }

  async returnByBarcode(barcode: string) {
    const copy = await prisma.copy.findUnique({ where: { barcode } });
    if (!copy) throw new AppError('No copy found for this barcode', 404);

    const loan = await prisma.loan.findFirst({
      where: { copy_id: copy.id, returned_at: null },
      include: { user: true },
    });
    if (!loan) throw new AppError('No active loan found for this barcode', 404);

    const now = new Date();
    let fine: Prisma.FineGetPayload<object> | null = null;

    await prisma.$transaction(async (tx) => {
      await tx.loan.update({ where: { id: loan.id }, data: { returned_at: now } });
      await tx.copy.update({ where: { id: copy.id }, data: { status: 'AVAILABLE' } });
    });

    // Overdue fine, capped, based on the borrower's level.
    if (now > loan.due_date) {
      const daysOverdue = differenceInCalendarDays(now, loan.due_date);
      const level = (loan.user.year_of_study ?? 0) >= 5 ? 'postgraduate' : 'undergraduate';
      const rate = await settingsService.getNumber(`fine_rate_${level}`);
      const cap = await settingsService.getNumber('fine_max_cap_ghs');
      const amount = Math.min(daysOverdue * rate, cap);
      if (amount > 0) {
        fine = await prisma.fine.create({
          data: {
            loan_id: loan.id,
            user_id: loan.user_id,
            amount: new Prisma.Decimal(amount.toFixed(2)),
            reason: `${daysOverdue} day(s) overdue`,
          },
        });
      }
    }

    // Recompute availability, then promote the next reservation (if any).
    await updateAvailableCopies(copy.catalog_item_id);
    await promoteQueue(copy.catalog_item_id);

    const fresh = await prisma.loan.findUnique({ where: { id: loan.id }, include: loanInclude });
    return { loan: fresh, fine };
  }

  async renew(loanId: string, requester: { id: string; role: string }) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { copy: true },
    });
    if (!loan) throw new AppError('Loan not found', 404);

    // A student may only renew their own loan.
    if (requester.role === 'STUDENT' && loan.user_id !== requester.id) {
      throw new AppError('You can only renew your own loans', 403);
    }
    if (loan.returned_at) throw new AppError('This loan has already been returned', 400);

    const maxRenewals = await settingsService.getNumber('max_renewals');
    if (loan.renewal_count >= maxRenewals) {
      throw new AppError(`Maximum renewals reached (${maxRenewals})`, 400);
    }

    // Block renewal if someone else is waiting for this title.
    const contested = await prisma.reservation.count({
      where: { catalog_item_id: loan.copy.catalog_item_id, status: { in: ['WAITING', 'READY'] } },
    });
    if (contested > 0) {
      throw new AppError('Cannot renew: another member has reserved this title', 400);
    }

    const loanPeriodDays = await settingsService.getNumber('loan_period_days');
    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: { due_date: addDays(loan.due_date, loanPeriodDays), renewal_count: { increment: 1 } },
      include: loanInclude,
    });
    return updated;
  }

  async listLoans(query: LoansQuery) {
    const where: Prisma.LoanWhereInput = {};
    if (query.user_id) where.user_id = query.user_id;
    if (query.overdue) {
      where.returned_at = null;
      where.due_date = { lt: new Date() };
    }
    if (query.from || query.to) {
      where.issued_at = {};
      if (query.from) (where.issued_at as Prisma.DateTimeFilter).gte = new Date(query.from);
      if (query.to) (where.issued_at as Prisma.DateTimeFilter).lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: loanInclude,
        orderBy: { issued_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.loan.count({ where }),
    ]);
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  /** Copies returned today, grouped/ordered by shelf location for reshelving. */
  async reshelfList() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const loans = await prisma.loan.findMany({
      where: { returned_at: { gte: start } },
      include: { copy: { include: { catalog_item: true } } },
      orderBy: { returned_at: 'desc' },
    });
    return loans
      .map((l) => ({
        loan_id: l.id,
        barcode: l.copy.barcode,
        title: l.copy.catalog_item.title,
        author: l.copy.catalog_item.author,
        shelf_location: l.copy.catalog_item.shelf_location ?? 'Unshelved',
        returned_at: l.returned_at,
      }))
      .sort((a, b) => a.shelf_location.localeCompare(b.shelf_location));
  }
}

export const circulationService = new CirculationService();
