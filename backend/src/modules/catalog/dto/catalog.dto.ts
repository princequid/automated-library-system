// backend/src/modules/catalog/dto/catalog.dto.ts
import { z } from 'zod';

export const listCatalogQuery = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  isbn: z.string().optional(),
  subject: z.string().optional(),
  search: z.string().optional(), // convenience: matches title OR author
  available_only: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createCatalogSchema = z.object({
  isbn: z.string().optional(),
  title: z.string().min(1),
  author: z.string().min(1),
  author_id: z.string().optional(),
  publisher: z.string().optional(),
  publisher_id: z.string().optional(),
  year: z.coerce.number().int().optional(),
  subject_tags: z.array(z.string()).default([]),
  category_ids: z.array(z.string()).default([]),
  abstract: z.string().optional(),
  shelf_location: z.string().optional(),
  shelf_id: z.string().optional(),
  replacement_cost: z.coerce.number().positive().optional(),
  cover_url: z.string().url().optional(),
});

export const updateCatalogSchema = createCatalogSchema.partial();

export const addCopiesSchema = z.object({
  barcode: z.string().optional(),
  condition: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
});

export const updateCopySchema = z.object({
  status: z.enum(['AVAILABLE', 'ON_LOAN', 'RESERVED', 'DAMAGED', 'LOST', 'WITHDRAWN']).optional(),
  condition: z.string().optional(),
});

export type ListCatalogQuery = z.infer<typeof listCatalogQuery>;
export type CreateCatalogDto = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogDto = z.infer<typeof updateCatalogSchema>;
export type AddCopiesDto = z.infer<typeof addCopiesSchema>;
export type UpdateCopyDto = z.infer<typeof updateCopySchema>;
