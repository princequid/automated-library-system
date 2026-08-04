// backend/src/config/redis.ts
// Redis singleton via ioredis with a graceful in-memory Map fallback.
// If Redis cannot be reached at startup, the app logs a clear warning and keeps
// running using an in-process store so local development never blocks on Redis.
import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// The minimal command surface the app relies on. Both the real Redis client and
// the in-memory fallback implement this, so callers never branch on which is active.
export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: 'EX', ttlSeconds?: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
}

// ---- In-memory fallback -----------------------------------------------------
class InMemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  private isExpired(entry: { expiresAt: number | null }): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: 'EX', ttlSeconds?: number): Promise<'OK'> {
    const expiresAt = mode === 'EX' && ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      if (this.store.delete(key)) removed += 1;
    }
    return removed;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (current ? parseInt(current, 10) : 0) + 1;
    const entry = this.store.get(key);
    this.store.set(key, { value: String(next), expiresAt: entry?.expiresAt ?? null });
    return next;
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + ttlSeconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    return Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000));
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    const result: string[] = [];
    for (const [key, entry] of this.store.entries()) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) result.push(key);
    }
    return result;
  }
}

// ---- Selection --------------------------------------------------------------
let client: RedisLike;
let usingFallback = false;

function createClient(): RedisLike {
  // During tests we never touch a real Redis.
  if (process.env.NODE_ENV === 'test') {
    usingFallback = true;
    return new InMemoryRedis();
  }

  try {
    const redis = new Redis(env.REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });

    redis.on('error', (err) => {
      if (!usingFallback) {
        logger.warn(`Redis error (${err.message}). Falling back to in-memory store.`);
        usingFallback = true;
        client = new InMemoryRedis();
      }
    });

    redis.on('connect', () => logger.info('Connected to Redis.'));
    return redis as unknown as RedisLike;
  } catch (err) {
    logger.warn(`Could not initialise Redis (${(err as Error).message}). Using in-memory fallback.`);
    usingFallback = true;
    return new InMemoryRedis();
  }
}

client = createClient();

export const redis = new Proxy({} as RedisLike, {
  get(_target, prop) {
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function isRedisFallback(): boolean {
  return usingFallback;
}
