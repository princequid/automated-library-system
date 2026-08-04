// backend/src/modules/users/dto/user.dto.ts
import { z } from 'zod';

export const userRoleEnum = z.enum([
  'STUDENT',
  'DESK_STAFF',
  'LIBRARIAN',
  'SENIOR_LIBRARIAN',
  'SUPER_ADMIN',
]);
export const userStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'GRADUATED', 'DELETED']);

export const listUsersQuery = z.object({
  role: userRoleEnum.optional(),
  status: userStatusEnum.optional(),
  department: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleEnum.default('STUDENT'),
  student_id: z.string().optional(),
  department: z.string().optional(),
  year_of_study: z.coerce.number().int().min(1).max(10).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  year_of_study: z.coerce.number().int().min(1).max(10).optional(),
});

export const updateStatusSchema = z.object({
  status: userStatusEnum,
  reason: z.string().min(1, 'A reason is required'),
});

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
