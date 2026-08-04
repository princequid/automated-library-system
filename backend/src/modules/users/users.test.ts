// backend/src/modules/users/users.test.ts
// Eligibility + bulk-import behaviour with Prisma/settings mocked.

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  loan: { count: jest.fn() },
  fine: { aggregate: jest.fn() },
};
jest.mock('../../config/database', () => ({ prisma: mockPrisma }));

const mockSettings = { getNumber: jest.fn() };
jest.mock('../settings/settings.service', () => ({ settingsService: mockSettings }));

jest.mock('bcrypt', () => ({ hash: jest.fn(async () => 'hashed') }));

import { checkEligibility } from './eligibility';
import { usersService } from './users.service';
import { Prisma } from '@prisma/client';

const baseUser = { id: 'u1', year_of_study: 2 };

beforeEach(() => {
  jest.clearAllMocks();
  mockSettings.getNumber.mockImplementation(async (key: string) => {
    const map: Record<string, number> = {
      loan_limit_undergraduate: 5,
      loan_limit_postgraduate: 8,
      fine_blocking_threshold_ghs: 10,
    };
    return map[key];
  });
});

describe('checkEligibility', () => {
  it('is ineligible with the correct reason at the loan limit', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);
    mockPrisma.loan.count.mockResolvedValue(5);
    mockPrisma.fine.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

    const result = await checkEligibility('u1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('Loan limit reached (5/5)');
  });

  it('is ineligible with the correct reason at the fine threshold', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);
    mockPrisma.loan.count.mockResolvedValue(1);
    mockPrisma.fine.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(12) } });

    const result = await checkEligibility('u1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Outstanding fines: GHS 12.00');
  });

  it('is eligible when under both limits', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);
    mockPrisma.loan.count.mockResolvedValue(1);
    mockPrisma.fine.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

    const result = await checkEligibility('u1');
    expect(result.eligible).toBe(true);
  });

  it('uses the postgraduate loan limit for year_of_study >= 5', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2', year_of_study: 6 });
    mockPrisma.loan.count.mockResolvedValue(6);
    mockPrisma.fine.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

    const result = await checkEligibility('u2');
    expect(result.loan_limit).toBe(8);
    expect(result.eligible).toBe(true);
  });
});

describe('usersService.bulkImport', () => {
  it('skips duplicate emails without failing the whole batch', async () => {
    mockPrisma.user.create
      .mockResolvedValueOnce({ id: 'a' })
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' })
      )
      .mockResolvedValueOnce({ id: 'c' });

    const csv = [
      'name,email,student_id,department,year_of_study',
      'Ama,ama@uni.edu,20210045,CS,2',
      'Dup,ama@uni.edu,20210046,CS,2',
      'Kofi,kofi@uni.edu,20210047,EE,3',
    ].join('\n');

    const result = await usersService.bulkImport(csv);
    expect(result.created).toBe(2);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toContain('Duplicate');
    expect(result.credentialsCsv).toContain('email,temp_password');
  });
});
