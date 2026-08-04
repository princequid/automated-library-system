// backend/src/shared/asyncHandler.ts
// Wraps an async controller so any thrown/rejected error is forwarded to the
// Express error handler instead of crashing the process.
import { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
