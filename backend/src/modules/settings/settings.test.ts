// backend/src/modules/settings/settings.test.ts
// Verifies the settings cache reads through Redis and invalidates on write.

const mockPrisma = {
  setting: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
};
jest.mock('../../config/database', () => ({ prisma: mockPrisma }));

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
};
jest.mock('../../config/redis', () => ({ redis: mockRedis }));

import { settingsService } from './settings.service';

beforeEach(() => {
  store.clear();
  jest.clearAllMocks();
});

describe('settingsService cache', () => {
  it('reads from DB on a cache miss then serves from cache on the next read', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ key: 'loan_period_days', value: '14', type: 'number' });

    expect(await settingsService.getNumber('loan_period_days')).toBe(14);
    expect(mockPrisma.setting.findUnique).toHaveBeenCalledTimes(1);

    // Second read is served from Redis; no additional DB hit.
    expect(await settingsService.getNumber('loan_period_days')).toBe(14);
    expect(mockPrisma.setting.findUnique).toHaveBeenCalledTimes(1);
  });

  it('invalidates the cache key on write', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: 'max_renewals',
      value: '2',
      type: 'number',
    });
    await settingsService.getNumber('max_renewals'); // populate cache
    expect(store.has('setting:max_renewals')).toBe(true);

    mockPrisma.setting.update.mockResolvedValue({});
    await settingsService.set('max_renewals', '3', 'admin');
    expect(store.has('setting:max_renewals')).toBe(false);
  });

  it('rejects a non-numeric value for a number setting with 422', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ key: 'loan_period_days', value: '14', type: 'number' });
    await expect(settingsService.set('loan_period_days', 'abc', 'admin')).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});
