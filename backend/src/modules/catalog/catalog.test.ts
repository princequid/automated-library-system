// backend/src/modules/catalog/catalog.test.ts
const mockPrisma = {
  catalogItem: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  copy: { count: jest.fn(), createMany: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
};
jest.mock('../../config/database', () => ({ prisma: mockPrisma }));
jest.mock('../settings/settings.service', () => ({
  settingsService: { getNumber: jest.fn(async () => 14) },
}));

import { catalogService, updateAvailableCopies } from './catalog.service';

beforeEach(() => jest.clearAllMocks());

describe('catalog', () => {
  it('rejects a duplicate ISBN with 409', async () => {
    mockPrisma.catalogItem.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      catalogService.create({ isbn: '123', title: 'T', author: 'A', subject_tags: [] }, 'admin')
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('excludes zero-availability items when available_only is set', async () => {
    mockPrisma.catalogItem.findMany.mockResolvedValue([]);
    mockPrisma.catalogItem.count.mockResolvedValue(0);
    await catalogService.list({ available_only: true, page: 1, limit: 20 } as never);

    const whereArg = mockPrisma.catalogItem.findMany.mock.calls[0][0].where;
    const clauses = JSON.stringify(whereArg);
    expect(clauses).toContain('available_copies');
    expect(clauses).toContain('"gt":0');
  });

  it('updateAvailableCopies recalculates from AVAILABLE copy count', async () => {
    mockPrisma.copy.count.mockResolvedValueOnce(3).mockResolvedValueOnce(5); // available, total
    mockPrisma.catalogItem.update.mockResolvedValue({});
    await updateAvailableCopies('item-1');
    expect(mockPrisma.catalogItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { available_copies: 3, total_copies: 5 },
    });
  });

  it('addCopies creates the requested number of copies', async () => {
    mockPrisma.catalogItem.findFirst.mockResolvedValue({ id: 'item-1', copies: [] });
    mockPrisma.copy.createMany.mockResolvedValue({ count: 3 });
    mockPrisma.copy.count.mockResolvedValue(3);
    mockPrisma.catalogItem.update.mockResolvedValue({});
    mockPrisma.copy.findMany.mockResolvedValue([{}, {}, {}]);

    await catalogService.addCopies('item-1', { quantity: 3 });
    const createArg = mockPrisma.copy.createMany.mock.calls[0][0];
    expect(createArg.data).toHaveLength(3);
  });
});
