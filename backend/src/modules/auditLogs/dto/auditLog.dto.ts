// backend/src/modules/auditLogs/dto/auditLog.dto.ts
import { z } from 'zod';

export const listAuditLogsQuery = z.object({
  actor_id: z.string().optional(),
  entity_type: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuery>;
