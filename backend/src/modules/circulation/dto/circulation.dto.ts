// backend/src/modules/circulation/dto/circulation.dto.ts
import { z } from 'zod';

export const issueSchema = z.object({
  copy_id: z.string().min(1),
  user_id: z.string().min(1),
});

export const selfBorrowSchema = z.object({
  copy_id: z.string().min(1),
  // Deliberately no user_id: a student can only borrow for themselves.
});

export const returnSchema = z.object({
  barcode: z.string().min(1),
});

export const renewSchema = z.object({
  loan_id: z.string().min(1),
});

export const loansQuery = z.object({
  overdue: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  user_id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type IssueDto = z.infer<typeof issueSchema>;
export type SelfBorrowDto = z.infer<typeof selfBorrowSchema>;
export type ReturnDto = z.infer<typeof returnSchema>;
export type RenewDto = z.infer<typeof renewSchema>;
export type LoansQuery = z.infer<typeof loansQuery>;
