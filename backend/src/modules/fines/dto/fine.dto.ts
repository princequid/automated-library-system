// backend/src/modules/fines/dto/fine.dto.ts
import { z } from 'zod';

export const listFinesQuery = z.object({
  paid: z.union([z.literal('true'), z.literal('false')]).transform((v) => v === 'true').optional(),
  waived: z.union([z.literal('true'), z.literal('false')]).transform((v) => v === 'true').optional(),
  user_id: z.string().optional(),
});

export const createFineSchema = z.object({
  user_id: z.string().min(1),
  amount: z.coerce.number().positive(),
  reason: z.string().min(1),
  loan_id: z.string().optional(),
});

export const waiveFineSchema = z.object({
  reason: z.string().min(1, 'A reason is required to waive a fine'),
});

export const payFinesSchema = z.object({
  fine_ids: z.array(z.string().min(1)).min(1),
  payment_reference: z.string().optional(),
});

export type ListFinesQuery = z.infer<typeof listFinesQuery>;
export type CreateFineDto = z.infer<typeof createFineSchema>;
export type WaiveFineDto = z.infer<typeof waiveFineSchema>;
export type PayFinesDto = z.infer<typeof payFinesSchema>;
