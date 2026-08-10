// backend/src/modules/acquisitions/dto/acquisitions.dto.ts
import { z } from 'zod';

export const listAcquisitionsQuery = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'REJECTED', 'ORDERED', 'RECEIVED']).optional(),
});

export const createAcquisitionSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().optional(),
  notes: z.string().optional(),
  // Librarian's ballpark figure at request time - feeds the Administrator
  // dashboard's acquisition-expenditure analytics once RECEIVED.
  estimated_cost: z.coerce.number().nonnegative().optional(),
});

export const rejectAcquisitionSchema = z.object({
  reason: z.string().min(1, 'A reason is required to reject a request'),
});

export const receiveAcquisitionSchema = z.object({
  publisher: z.string().optional(),
  year: z.coerce.number().int().optional(),
  shelf_location: z.string().optional(),
  shelf_id: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
});

export type ListAcquisitionsQuery = z.infer<typeof listAcquisitionsQuery>;
export type CreateAcquisitionDto = z.infer<typeof createAcquisitionSchema>;
export type RejectAcquisitionDto = z.infer<typeof rejectAcquisitionSchema>;
export type ReceiveAcquisitionDto = z.infer<typeof receiveAcquisitionSchema>;
