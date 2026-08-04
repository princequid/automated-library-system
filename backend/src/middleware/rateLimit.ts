// backend/src/middleware/rateLimit.ts
// Redis-backed fixed-window rate limiter. 100 req/min general; a stricter factory
// (20 req/min) guards the auth routes. Uses INCR + EXPIRE which works identically
// against real Redis and the in-memory fallback.
import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { AppError } from '../shared/appError';
import { logger } from '../config/logger';

function clientKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

export function rateLimiter(limit: number, windowSeconds: number, bucket: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = `ratelimit:${bucket}:${clientKey(req)}:${windowId}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      if (count > limit) {
        throw new AppError('Too many requests. Please slow down and try again shortly.', 429);
      }
      next();
    } catch (err) {
      if (err instanceof AppError) return next(err);
      // Never let a rate-limiter backend failure take the API down.
      logger.warn(`Rate limiter unavailable, allowing request: ${(err as Error).message}`);
      next();
    }
  };
}

export const generalRateLimit = rateLimiter(100, 60, 'general');
export const authRateLimit = rateLimiter(20, 60, 'auth');
