// backend/src/middleware/errorHandler.ts
// Terminal error middleware (4 args). Maps AppError to its status code, Zod errors
// to 422, Prisma known errors to sensible codes, and everything else to a generic
// 500. Full detail is logged via Winston; stack traces never reach the client.
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../shared/appError';
import { logger } from '../config/logger';
import { env } from '../config/env';

interface ErrorBody {
  success: false;
  error: string;
  details?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): Response {
  // --- Zod validation errors --------------------------------------------------
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    logger.warn(`Validation failed on ${req.method} ${req.path}`);
    return res.status(422).json({ success: false, error: 'Validation failed', details } as ErrorBody);
  }

  // --- Known Prisma errors ----------------------------------------------------
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res
        .status(409)
        .json({ success: false, error: 'A record with this value already exists.' } as ErrorBody);
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Record not found.' } as ErrorBody);
    }
    logger.error(`Prisma error ${err.code} on ${req.method} ${req.path}: ${err.message}`);
    return res.status(400).json({ success: false, error: 'Database request error.' } as ErrorBody);
  }

  // --- Operational AppError ---------------------------------------------------
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`AppError ${err.statusCode} on ${req.method} ${req.path}: ${err.message}`);
    } else {
      logger.warn(`AppError ${err.statusCode} on ${req.method} ${req.path}: ${err.message}`);
    }
    const body: ErrorBody = { success: false, error: err.message };
    if (err.details !== undefined) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // --- Unknown / unexpected ---------------------------------------------------
  const asError = err as Error;
  logger.error(`Unhandled error on ${req.method} ${req.path}: ${asError?.message}`, { stack: asError?.stack });
  const body: ErrorBody = { success: false, error: 'Internal server error' };
  if (!env.isProd && asError?.message) body.details = asError.message;
  return res.status(500).json(body);
}

// 404 handler for unmatched routes (mounted before the error handler).
export function notFoundHandler(req: Request, res: Response): Response {
  return res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
}
