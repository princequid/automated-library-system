// backend/src/middleware/validate.ts
// Zod validation middleware factories. On success the parsed (and coerced) value
// replaces the raw input so controllers read clean, typed data. On failure a
// ZodError propagates to the error handler, which returns 422 with field details.
import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

// Accept any Zod schema (ZodTypeAny) so schemas using .transform()/.default(),
// whose input and output types differ, are supported without friction.
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Express query is read-only in some setups; stash the parsed value.
    const parsed = schema.parse(req.query);
    Object.defineProperty(req, 'validatedQuery', { value: parsed, writable: true, configurable: true });
    (req as unknown as { query: unknown }).query = parsed;
    next();
  };
}

export function validateParams(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.params = schema.parse(req.params) as typeof req.params;
    next();
  };
}
