// backend/src/modules/users/users.service.ts
// User management: listing, provisioning (with one-time temp passwords), bulk
// student import, profile/status updates, and per-user loan/fine views. The
// password_hash is never selected into any response.
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/appError';
import { generateTempPassword } from '../../shared/password';
import { parseCsv, toCsv } from '../../shared/csv';
import { buildMeta } from '../../shared/responseHelper';
import { CreateUserDto, ListUsersQuery, UpdateStatusDto, UpdateUserDto } from './dto/user.dto';

const BCRYPT_COST = 12;

// Explicit select that omits password_hash - reused everywhere a user is returned.
const publicUserSelect = {
  id: true,
  email: true,
  student_id: true,
  name: true,
  department: true,
  year_of_study: true,
  role: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

class UsersService {
  async list(query: ListUsersQuery) {
    const where: Prisma.UserWhereInput = { deleted_at: null };
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { student_id: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: { created_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async getById(id: string) {
    const user = await prisma.user.findFirst({ where: { id, deleted_at: null }, select: publicUserSelect });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  /** Create a single account; returns the plaintext temp password exactly once. */
  async create(dto: CreateUserDto): Promise<{ user: unknown; tempPassword: string }> {
    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, BCRYPT_COST);
    try {
      const user = await prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          role: dto.role,
          student_id: dto.student_id,
          department: dto.department,
          year_of_study: dto.year_of_study,
          password_hash: hash,
        },
        select: publicUserSelect,
      });
      return { user, tempPassword };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('A user with this email or student ID already exists', 409);
      }
      throw err;
    }
  }

  /**
   * Bulk-import STUDENT accounts from CSV (name,email,student_id,department,
   * year_of_study). Duplicates are skipped and reported; the whole batch never
   * fails because of one bad row. Returns a credentials CSV for distribution.
   */
  async bulkImport(csvText: string): Promise<{
    created: number;
    skipped: { row: number; email: string; reason: string }[];
    credentialsCsv: string;
  }> {
    const rows = parseCsv(csvText);
    const created: [string, string][] = []; // [email, tempPassword]
    const skipped: { row: number; email: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const email = (row.email ?? '').trim().toLowerCase();
      if (!email || !row.name) {
        skipped.push({ row: i + 2, email, reason: 'Missing name or email' });
        continue;
      }
      const tempPassword = generateTempPassword();
      const hash = await bcrypt.hash(tempPassword, BCRYPT_COST);
      try {
        await prisma.user.create({
          data: {
            name: row.name.trim(),
            email,
            student_id: row.student_id?.trim() || null,
            department: row.department?.trim() || null,
            year_of_study: row.year_of_study ? parseInt(row.year_of_study, 10) || null : null,
            role: 'STUDENT',
            password_hash: hash,
          },
        });
        created.push([email, tempPassword]);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          skipped.push({ row: i + 2, email, reason: 'Duplicate email or student ID' });
        } else {
          skipped.push({ row: i + 2, email, reason: 'Unexpected error' });
        }
      }
    }

    const credentialsCsv = toCsv(['email', 'temp_password'], created);
    return { created: created.length, skipped, credentialsCsv };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.getById(id);
    try {
      return await prisma.user.update({ where: { id }, data: dto, select: publicUserSelect });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('Email already in use', 409);
      }
      throw err;
    }
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    await this.getById(id);
    return prisma.user.update({ where: { id }, data: { status: dto.status }, select: publicUserSelect });
  }

  /** Own profile enriched with live activity counts. */
  async getMe(id: string) {
    const user = await this.getById(id);
    const [activeLoanCount, fineAgg] = await Promise.all([
      prisma.loan.count({ where: { user_id: id, returned_at: null } }),
      prisma.fine.aggregate({ where: { user_id: id, paid: false, waived: false }, _sum: { amount: true } }),
    ]);
    return {
      ...user,
      activeLoanCount,
      outstandingFineTotal: Number(fineAgg._sum.amount ?? 0),
    };
  }

  async getUserLoans(id: string) {
    return prisma.loan.findMany({
      where: { user_id: id },
      include: { copy: { include: { catalog_item: true } }, fines: true },
      orderBy: { issued_at: 'desc' },
    });
  }

  async getUserFines(id: string) {
    return prisma.fine.findMany({ where: { user_id: id }, orderBy: { created_at: 'desc' } });
  }
}

export const usersService = new UsersService();
