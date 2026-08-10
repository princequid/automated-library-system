// backend/src/modules/auditLogs/auditLog.service.ts
// AuditLog rows have been written by middleware/auditLog.ts since day one -
// this module is only the read side, which the checklist audit found missing
// entirely (the data existed but nothing could ever list it back).
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { buildMeta } from '../../shared/responseHelper';
import { ListAuditLogsQuery } from './dto/auditLog.dto';

class AuditLogService {
  // LIBRARIAN sees only their own actions ("limited own actions" per the
  // role-separation spec); ADMINISTRATOR is unrestricted. Any actor_id the
  // caller passed is ignored when they're a Librarian - it's forced to self.
  async list(query: ListAuditLogsQuery, requester: { id: string; role: UserRole }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (requester.role === 'LIBRARIAN') {
      where.actor_id = requester.id;
    } else if (query.actor_id) {
      where.actor_id = query.actor_id;
    }
    if (query.entity_type) where.entity_type = query.entity_type;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.from || query.to) {
      where.created_at = {};
      if (query.from) (where.created_at as Prisma.DateTimeFilter).gte = new Date(query.from);
      if (query.to) (where.created_at as Prisma.DateTimeFilter).lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }
}

export const auditLogService = new AuditLogService();
