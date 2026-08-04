// backend/src/modules/circulation/circulation.test.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma: any = {
  copy: { findUnique: jest.fn(), update: jest.fn() },
  loan: { create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  fine: { create: jest.fn() },
  reservation: { count: jest.fn() },
  $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
    typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb as never)
  ),
};
jest.mock('../../config/database', () => ({ prisma: mockPrisma }));

const mockSettings = { getNumber: jest.fn(), getBoolean: jest.fn() };
jest.mock('../settings/settings.service', () => ({ settingsService: mockSettings }));

const mockCheckEligibility = jest.fn();
jest.mock('./eligibility.service', () => ({ checkEligibility: (...a: unknown[]) => mockCheckEligibility(...a) }));

jest.mock('../catalog/catalog.service', () => ({ updateAvailableCopies: jest.fn() }));
jest.mock('../reservations/reservations.service', () => ({ promoteQueue: jest.fn() }));

import { circulationService } from './circulation.service';

beforeEach(() => {
  jest.clearAllMocks();
  mockSettings.getNumber.mockImplementation(async (k: string) => {
    const map: Record<string, number> = {
      loan_period_days: 14,
      max_renewals: 2,
      fine_rate_undergraduate: 0.5,
      fine_max_cap_ghs: 20,
    };
    return map[k];
  });
});

describe('self-borrow gating', () => {
  it('is blocked when self_service_borrowing_enabled is false', async () => {
    mockSettings.getBoolean.mockResolvedValue(false);
    await expect(circulationService.selfBorrow('copy-1', 'stu-1')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('proceeds through eligibility when enabled', async () => {
    mockSettings.getBoolean.mockResolvedValue(true);
    mockCheckEligibility.mockResolvedValue({ eligible: false, reason: 'Loan limit reached (5/5)' });
    await expect(circulationService.selfBorrow('copy-1', 'stu-1')).rejects.toMatchObject({
      statusCode: 422,
      message: 'Loan limit reached (5/5)',
    });
  });
});

describe('issue', () => {
  it('fails with 422 when the member is at their loan limit', async () => {
    mockCheckEligibility.mockResolvedValue({ eligible: false, reason: 'Loan limit reached (5/5)' });
    await expect(circulationService.issue('copy-1', 'stu-1', 'staff-1')).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it('fails with 422 when the copy is not AVAILABLE', async () => {
    mockCheckEligibility.mockResolvedValue({ eligible: true });
    mockPrisma.copy.findUnique.mockResolvedValue({ id: 'copy-1', status: 'ON_LOAN', catalog_item_id: 'c1' });
    await expect(circulationService.issue('copy-1', 'stu-1', 'staff-1')).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});

describe('return with overdue fine', () => {
  it('creates a correctly-capped fine on an overdue loan', async () => {
    const dueDate = new Date(Date.now() - 100 * 24 * 3600 * 1000); // 100 days overdue -> should cap
    mockPrisma.copy.findUnique.mockResolvedValue({ id: 'copy-1', catalog_item_id: 'c1' });
    mockPrisma.loan.findFirst.mockResolvedValue({
      id: 'loan-1',
      user_id: 'stu-1',
      due_date: dueDate,
      user: { year_of_study: 2 },
    });
    mockPrisma.fine.create.mockResolvedValue({ id: 'fine-1' });
    mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan-1' });

    await circulationService.returnByBarcode('LIB-1');
    const fineArg = mockPrisma.fine.create.mock.calls[0][0].data;
    // 100 days * 0.5 = 50, capped at 20.
    expect(Number(fineArg.amount)).toBe(20);
  });
});

describe('renew', () => {
  it('rejects at max renewals', async () => {
    mockPrisma.loan.findUnique.mockResolvedValue({
      id: 'loan-1',
      user_id: 'stu-1',
      returned_at: null,
      renewal_count: 2,
      copy: { catalog_item_id: 'c1' },
    });
    await expect(circulationService.renew('loan-1', { id: 'stu-1', role: 'STUDENT' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects when another member has a reservation', async () => {
    mockPrisma.loan.findUnique.mockResolvedValue({
      id: 'loan-1',
      user_id: 'stu-1',
      returned_at: null,
      renewal_count: 0,
      copy: { catalog_item_id: 'c1' },
    });
    mockPrisma.reservation.count.mockResolvedValue(1);
    await expect(circulationService.renew('loan-1', { id: 'stu-1', role: 'STUDENT' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
