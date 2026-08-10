// backend/src/modules/inventory/dto/inventory.dto.ts
import { z } from 'zod';

export const startSessionSchema = z.object({
  shelf_id: z.string().optional(),
});

export const scanSchema = z.object({
  barcode: z.string().min(1),
});

export type StartSessionDto = z.infer<typeof startSessionSchema>;
export type ScanDto = z.infer<typeof scanSchema>;
