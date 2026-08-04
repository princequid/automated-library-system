// backend/src/modules/auth/auth.test.ts
// Unit tests for the auth service. Prisma and Redis are mocked so no external
// services are needed. Redis is emulated by a simple in-test Map.

import bcrypt from 'bcrypt';

// ---- Mock Prisma ------------------------------------------------------------
const mockUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};
jest.mock('../../config/database', () => ({ prisma: { user: mockUser } }));

// ---- Mock Redis with an in-test store ---------------------------------------
const store = new Map<string, string>();
const mockRedis = {
  get: jest.fn(async (k: string) => store.get(k) ?? null),
  set: jest.fn(async (k: string, v: string) => {
    store.set(k, v);
    return 'OK';
  }),
  del: jest.fn(async (...ks: string[]) => {
    ks.forEach((k) => store.delete(k));
    return ks.length;
  }),
  incr: jest.fn(async (k: string) => {
    const next = (parseInt(store.get(k) ?? '0', 10) || 0) + 1;
    store.set(k, String(next));
    return next;
  }),
  expire: jest.fn(async () => 1),
  keys: jest.fn(async (pattern: string) => {
    const prefix = pattern.replace('*', '');
    return [...store.keys()].filter((k) => k.startsWith(prefix));
  }),
};
jest.mock('../../config/redis', () => ({ redis: mockRedis }));

import { authService } from './auth.service';
import { AppError } from '../../shared/appError';

const student = {
  id: 'u-student',
  name: 'Ama Student',
  email: 'ama@uni.edu',
  role: 'STUDENT',
  status: 'ACTIVE',
  student_id: '20210045',
  department: 'Computer Science',
  password_hash: '',
};
const librarian = { ...student, id: 'u-lib', email: 'lib@uni.edu', role: 'LIBRARIAN', student_id: null };

beforeAll(async () => {
  student.password_hash = await bcrypt.hash('Student@123', 4);
  librarian.password_hash = await bcrypt.hash('Library@123', 4);
});

beforeEach(() => {
  store.clear();
  jest.clearAllMocks();
});

describe('authService.login', () => {
  it('returns role STUDENT for correct student credentials', async () => {
    mockUser.findUnique.mockResolvedValue(student);
    const result = await authService.login({ email: student.email, password: 'Student@123' });
    expect(result.user.role).toBe('STUDENT');
    expect(result.accessToken).toBeTruthy();
  });

  it('returns role LIBRARIAN for correct staff credentials', async () => {
    mockUser.findUnique.mockResolvedValue(librarian);
    const result = await authService.login({ email: librarian.email, password: 'Library@123' });
    expect(result.user.role).toBe('LIBRARIAN');
  });

  it('returns 401 for a wrong password', async () => {
    mockUser.findUnique.mockResolvedValue(student);
    await expect(authService.login({ email: student.email, password: 'nope' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('locks the account after 5 wrong passwords (429 on the 6th attempt)', async () => {
    mockUser.findUnique.mockResolvedValue(student);
    for (let i = 0; i < 5; i += 1) {
      await expect(authService.login({ email: student.email, password: 'wrong' })).rejects.toBeInstanceOf(
        AppError
      );
    }
    // 6th attempt: the lock is now set, expect 429 regardless of password.
    await expect(authService.login({ email: student.email, password: 'Student@123' })).rejects.toMatchObject(
      { statusCode: 429 }
    );
  });

  it('uses the same error for unknown email and inactive account (no enumeration)', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const unknown = authService.login({ email: 'ghost@uni.edu', password: 'x' });
    await expect(unknown).rejects.toMatchObject({ message: 'Invalid credentials', statusCode: 401 });

    mockUser.findUnique.mockResolvedValue({ ...student, status: 'SUSPENDED' });
    const inactive = authService.login({ email: student.email, password: 'Student@123' });
    await expect(inactive).rejects.toMatchObject({ message: 'Invalid credentials', statusCode: 401 });
  });
});

describe('authService refresh / logout', () => {
  it('refresh with a valid cookie returns a new access token, and fails after logout', async () => {
    mockUser.findUnique.mockResolvedValue(student);
    const { refreshToken } = await authService.login({ email: student.email, password: 'Student@123' });

    const refreshed = await authService.refresh(refreshToken);
    expect(refreshed.accessToken).toBeTruthy();

    // The old token was rotated out; use the new one, then log out and confirm 401.
    await authService.logout(refreshed.refreshToken);
    await expect(authService.refresh(refreshed.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('authService.changePassword', () => {
  it('rejects a wrong current password with 401', async () => {
    mockUser.findUnique.mockResolvedValue(student);
    await expect(authService.changePassword(student.id, 'wrong', 'newpassword123')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('updates the hash when the current password is correct', async () => {
    mockUser.findUnique.mockResolvedValue(student);
    mockUser.update.mockResolvedValue(student);
    await authService.changePassword(student.id, 'Student@123', 'newpassword123');
    expect(mockUser.update).toHaveBeenCalled();
  });
});
