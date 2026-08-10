// backend/src/modules/catalogData/catalogData.dto.ts
import { z } from 'zod';

export const authorSchema = z.object({ name: z.string().min(1), bio: z.string().optional() });
export const publisherSchema = z.object({ name: z.string().min(1), website: z.string().url().optional() });
export const categorySchema = z.object({ name: z.string().min(1) });

export type AuthorDto = z.infer<typeof authorSchema>;
export type PublisherDto = z.infer<typeof publisherSchema>;
export type CategoryDto = z.infer<typeof categorySchema>;
