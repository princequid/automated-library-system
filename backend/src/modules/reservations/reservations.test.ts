// backend/src/modules/reservations/reservations.test.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma: any = {
  reservation: { findFirst: jest.fn(), update: jest.fn(), count: jest.fn(), create: jest.fn() },
  copy: { findFirst: jest.fn(), update: jest.fn() },
  catalogItem: { update: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockPrisma)),
};
jest.mock('../../config/database', () => ({ prisma: mockPrisma }));
jest.mock('../settings/settings.service', () => ({
  settingsService: { getNumber: jest.fn(async () => 5) },
}));
jest.mock('../users/eligibility', () => ({ checkEligibility: jest.fn(async () => ({ eligible: true })) }));
jest.mock('../notifications/notifications.service', () => ({ notificationsService: { notify: jest.fn() } }));

import { promoteQueue } from './reservations.service';

beforeEach(() => jest.clearAllMocks());

describe('promoteQueue', () => {
  it('sets the lowest-position WAITING reservation to READY and flips a copy to RESERVED', async () => {
    mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'res-1', queue_position: 1 });
    mockPrisma.copy.findFirst.mockResolvedValue({ id: 'copy-1' });

    await promoteQueue('item-1');

    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'res-1' }, data: expect.objectContaining({ status: 'READY' }) })
    );
    expect(mockPrisma.copy.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'copy-1' }, data: { status: 'RESERVED' } })
    );
  });

  it('does nothing when there is no one waiting', async () => {
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    await promoteQueue('item-1');
    expect(mockPrisma.copy.update).not.toHaveBeenCalled();
  });

  it('does nothing when no copy is available yet', async () => {
    mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'res-1', queue_position: 1 });
    mockPrisma.copy.findFirst.mockResolvedValue(null);
    await promoteQueue('item-1');
    expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
  });
});
