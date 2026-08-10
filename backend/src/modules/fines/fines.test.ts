// backend/src/modules/fines/fines.test.ts
const mockPrisma = {
  fine: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
  user: { findUnique: jest.fn() },
};
jest.mock('../../config/database', () => ({ prisma: mockPrisma }));
jest.mock('../notifications/notifications.service', () => ({ notificationsService: { notify: jest.fn() } }));

import { finesService } from './fines.service';

beforeEach(() => jest.clearAllMocks());

describe('fines waive', () => {
  it('waives a fine, recording who waived it', async () => {
    mockPrisma.fine.findUnique.mockResolvedValue({ id: 'f1', reason: 'Overdue', paid: false, waived: false });
    mockPrisma.fine.update.mockResolvedValue({ id: 'f1', waived: true });
    await finesService.waive('f1', 'Goodwill', 'senior-1');
    expect(mockPrisma.fine.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ waived: true, waived_by: 'senior-1' }) })
    );
  });

  it('refuses to waive an already-paid fine', async () => {
    mockPrisma.fine.findUnique.mockResolvedValue({ id: 'f1', paid: true, waived: false, reason: 'x' });
    await expect(finesService.waive('f1', 'x', 'senior-1')).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('fines pay', () => {
  it("rejects paying another student's fine", async () => {
    mockPrisma.fine.findMany.mockResolvedValue([{ id: 'f1', user_id: 'other', paid: false, waived: false, amount: 5 }]);
    await expect(finesService.pay('me', { fine_ids: ['f1'] })).rejects.toMatchObject({ statusCode: 403 });
  });

  it('marks owned unpaid fines as paid', async () => {
    mockPrisma.fine.findMany.mockResolvedValue([{ id: 'f1', user_id: 'me', paid: false, waived: false, amount: 5 }]);
    mockPrisma.fine.updateMany.mockResolvedValue({ count: 1 });
    const result = await finesService.pay('me', { fine_ids: ['f1'] });
    expect(result.paidCount).toBe(1);
    expect(result.total).toBe(5);
  });
});
