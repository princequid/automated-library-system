// backend/src/modules/maintenance/dto/maintenance.dto.ts
import { z } from 'zod';

export const listMaintenanceQuery = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WITHDRAWN']).optional(),
});

export const openMaintenanceSchema = z.object({
  copy_id: z.string().min(1),
  severity: z.enum(['MINOR', 'MAJOR', 'SEVERE']),
  notes: z.string().optional(),
});

export const resolveMaintenanceSchema = z.object({
  outcome: z.enum(['repaired', 'withdraw']),
  notes: z.string().optional(),
});

export type ListMaintenanceQuery = z.infer<typeof listMaintenanceQuery>;
export type OpenMaintenanceDto = z.infer<typeof openMaintenanceSchema>;
export type ResolveMaintenanceDto = z.infer<typeof resolveMaintenanceSchema>;
