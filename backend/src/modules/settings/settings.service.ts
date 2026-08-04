// backend/src/modules/settings/settings.service.ts
// Settings are the single source of truth for fine rates, loan limits, borrowing
// rules, etc. Every other module reads them through this exported singleton, which
// caches values in Redis (10-min TTL) to avoid hitting the DB on hot paths.
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { AppError } from '../../shared/appError';

const CACHE_PREFIX = 'setting:';
const CACHE_TTL_SECONDS = 600; // 10 minutes

export interface SettingUpdate {
  key: string;
  value: string;
}

class SettingsService {
  /** Raw string value, cached. */
  async get(key: string): Promise<string> {
    const cached = await redis.get(CACHE_PREFIX + key);
    if (cached !== null) return cached;

    const row = await prisma.setting.findUnique({ where: { key } });
    if (!row) throw new AppError(`Unknown setting: ${key}`, 500);

    await redis.set(CACHE_PREFIX + key, row.value, 'EX', CACHE_TTL_SECONDS);
    return row.value;
  }

  async getNumber(key: string): Promise<number> {
    return parseFloat(await this.get(key));
  }

  async getBoolean(key: string): Promise<boolean> {
    return (await this.get(key)) === 'true';
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await prisma.setting.findMany();
    return rows.reduce<Record<string, string>>((acc, r) => {
      acc[r.key] = r.value;
      return acc;
    }, {});
  }

  /** Full setting rows (with type/description) for the admin Settings page. */
  async list() {
    return prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  private validateType(type: string, value: string): void {
    if (type === 'number' && Number.isNaN(parseFloat(value))) {
      throw new AppError(`Value for a number setting must be numeric, got "${value}"`, 422);
    }
    if (type === 'boolean' && value !== 'true' && value !== 'false') {
      throw new AppError(`Value for a boolean setting must be "true" or "false", got "${value}"`, 422);
    }
  }

  async set(key: string, value: string, updatedBy: string): Promise<void> {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) throw new AppError(`Unknown setting: ${key}`, 404);

    this.validateType(existing.type, value);
    await prisma.setting.update({ where: { key }, data: { value, updated_by: updatedBy } });
    await redis.del(CACHE_PREFIX + key);
  }

  async setMany(updates: SettingUpdate[], updatedBy: string): Promise<void> {
    const existing = await prisma.setting.findMany({
      where: { key: { in: updates.map((u) => u.key) } },
    });
    const byKey = new Map(existing.map((s) => [s.key, s]));

    // Validate everything before writing anything.
    for (const u of updates) {
      const row = byKey.get(u.key);
      if (!row) throw new AppError(`Unknown setting: ${u.key}`, 404);
      this.validateType(row.type, u.value);
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.setting.update({ where: { key: u.key }, data: { value: u.value, updated_by: updatedBy } })
      )
    );

    // Invalidate all affected cache keys.
    await redis.del(...updates.map((u) => CACHE_PREFIX + u.key));
  }
}

export const settingsService = new SettingsService();
