// backend/src/shared/responseHelper.ts
// The single success-response shape used by every controller in the system.
import { Response } from 'express';

export interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  meta?: Meta,
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    ...(meta ? { meta } : {}),
  });
}

export function sendCreated<T>(res: Response, data: T, message = 'Created', meta?: Meta): Response {
  return sendSuccess(res, data, message, meta, 201);
}

// Helper for building pagination meta consistently.
export function buildMeta(page: number, limit: number, total: number): Meta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
