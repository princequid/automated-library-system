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

import { promoteQueue, reservationsService } from './reservations.service';

beforeEach(() => jest.clearAllMocks());

describe('reservationsService.create', () => {
  it('goes straight to READY and claims a copy when one is AVAILABLE', async () => {
    mockPrisma.catalogItem.findUnique.mockResolvedValue({ id: 'item-1', title: 'Book', deleted_at: null });
    mockPrisma.reservation.findFirst.mockResolvedValue(null); // no existing active request
    mockPrisma.copy.findFirst.mockResolvedValue({ id: 'copy-1' });
    mockPrisma.reservation.create.mockResolvedValue({ id: 'res-1', status: 'READY', queue_position: 0 });

    const result = await reservationsService.create('user-1', 'item-1');

    expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'READY', queue_position: 0 }) })
    );
    expect(mockPrisma.copy.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'copy-1' }, data: { status: 'RESERVED' } })
    );
    expect(mockPrisma.catalogItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'item-1' }, data: { available_copies: { decrement: 1 } } })
    );
    expect(result.status).toBe('READY');
  });

  it('joins the WAITING queue when no copy is AVAILABLE', async () => {
    mockPrisma.catalogItem.findUnique.mockResolvedValue({ id: 'item-1', title: 'Book', deleted_at: null });
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.copy.findFirst.mockResolvedValue(null); // nothing AVAILABLE
    mockPrisma.reservation.count.mockResolvedValue(2); // 2 already waiting
    mockPrisma.reservation.create.mockResolvedValue({ id: 'res-2', status: 'WAITING', queue_position: 3 });

    const result = await reservationsService.create('user-1', 'item-1');

    expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ catalog_item_id: 'item-1', user_id: 'user-1', queue_position: 3 }) })
    );
    expect(mockPrisma.copy.update).not.toHaveBeenCalled();
    expect(result.status).toBe('WAITING');
  });

  it('rejects a duplicate active request on the same title', async () => {
    mockPrisma.catalogItem.findUnique.mockResolvedValue({ id: 'item-1', title: 'Book', deleted_at: null });
    mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(reservationsService.create('user-1', 'item-1')).rejects.toMatchObject({ statusCode: 400 });
    expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
  });
});

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
