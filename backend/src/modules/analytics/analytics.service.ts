// backend/src/modules/analytics/analytics.service.ts
// Reporting queries for the Admin dashboard and Analytics page. Ranges default to
// the last 30 days when not supplied. Uses Prisma aggregates and a few typed raw
// queries for date-grouped series.
import { startOfMonth, subDays } from 'date-fns';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

interface Range {
  from?: string;
  to?: string;
}

function resolveRange(range: Range): { from: Date; to: Date } {
  const to = range.to ? new Date(range.to) : new Date();
  const from = range.from ? new Date(range.from) : subDays(to, 30);
  return { from, to };
}

class AnalyticsService {
  /** Loans grouped by calendar day. */
  async loanVolume(range: Range) {
    const { from, to } = resolveRange(range);
    const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>(Prisma.sql`
      SELECT date_trunc('day', issued_at) AS day, COUNT(*)::bigint AS count
      FROM loans
      WHERE issued_at BETWEEN ${from} AND ${to}
      GROUP BY day
      ORDER BY day ASC
    `);
    return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
  }

  /** Top 10 titles by loan count in the range. */
  async topBorrowed(range: Range) {
    const { from, to } = resolveRange(range);
    const grouped = await prisma.loan.groupBy({
      by: ['copy_id'],
      where: { issued_at: { gte: from, lte: to } },
      _count: { copy_id: true },
      orderBy: { _count: { copy_id: 'desc' } },
      take: 50,
    });

    // Resolve copies -> catalog items, then aggregate counts per title.
    const copies = await prisma.copy.findMany({
      where: { id: { in: grouped.map((g) => g.copy_id) } },
      include: { catalog_item: { select: { id: true, title: true, author: true } } },
    });
    const copyToItem = new Map(copies.map((c) => [c.id, c.catalog_item]));

    const perTitle = new Map<string, { title: string; author: string; count: number }>();
    for (const g of grouped) {
      const item = copyToItem.get(g.copy_id);
      if (!item) continue;
      const entry = perTitle.get(item.id) ?? { title: item.title, author: item.author, count: 0 };
      entry.count += g._count.copy_id;
      perTitle.set(item.id, entry);
    }
    return [...perTitle.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }

  /** Loan counts grouped by the borrower's department. */
  async borrowingByDept() {
    const rows = await prisma.$queryRaw<{ department: string | null; count: bigint }[]>(Prisma.sql`
      SELECT u.department AS department, COUNT(*)::bigint AS count
      FROM loans l
      JOIN users u ON u.id = l.user_id
      GROUP BY u.department
      ORDER BY count DESC
    `);
    return rows.map((r) => ({ department: r.department ?? 'Unknown', count: Number(r.count) }));
  }

  /** Overdue percentage of active loans, per day. */
  async overdueRate(range: Range) {
    const { from, to } = resolveRange(range);
    const rows = await prisma.$queryRaw<{ day: Date; overdue: bigint; total: bigint }[]>(Prisma.sql`
      SELECT date_trunc('day', issued_at) AS day,
             COUNT(*) FILTER (WHERE returned_at IS NULL AND due_date < NOW())::bigint AS overdue,
             COUNT(*)::bigint AS total
      FROM loans
      WHERE issued_at BETWEEN ${from} AND ${to}
      GROUP BY day
      ORDER BY day ASC
    `);
    return rows.map((r) => ({
      day: r.day,
      overdue: Number(r.overdue),
      total: Number(r.total),
      rate: Number(r.total) === 0 ? 0 : Math.round((Number(r.overdue) / Number(r.total)) * 100),
    }));
  }

  /** Fines posted vs collected, per month. */
  async fineCollection(range: Range) {
    const { from, to } = resolveRange(range);
    const rows = await prisma.$queryRaw<{ month: Date; posted: number; collected: number }[]>(Prisma.sql`
      SELECT date_trunc('month', created_at) AS month,
             COALESCE(SUM(amount), 0)::float AS posted,
             COALESCE(SUM(amount) FILTER (WHERE paid = true), 0)::float AS collected
      FROM fines
      WHERE created_at BETWEEN ${from} AND ${to}
      GROUP BY month
      ORDER BY month ASC
    `);
    return rows.map((r) => ({ month: r.month, posted: Number(r.posted), collected: Number(r.collected) }));
  }

  /** The four headline numbers the Admin dashboard loads with. */
  async dashboardStats() {
    const monthStart = startOfMonth(new Date());
    const weekStart = subDays(new Date(), 7);

    const [activeLoans, overdueCount, finesCollected, itemsAdded] = await Promise.all([
      prisma.loan.count({ where: { returned_at: null } }),
      prisma.loan.count({ where: { returned_at: null, due_date: { lt: new Date() } } }),
      prisma.fine.aggregate({
        where: { paid: true, paid_at: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.catalogItem.count({ where: { created_at: { gte: weekStart }, deleted_at: null } }),
    ]);

    return {
      activeLoans,
      overdueCount,
      finesCollectedThisMonth: Number(finesCollected._sum.amount ?? 0),
      itemsAddedThisWeek: itemsAdded,
    };
  }

  /** Recent circulation activity for the dashboard table. */
  async recentActivity() {
    return prisma.loan.findMany({
      take: 10,
      orderBy: { issued_at: 'desc' },
      include: {
        copy: { include: { catalog_item: { select: { title: true } } } },
        user: { select: { name: true, student_id: true } },
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
