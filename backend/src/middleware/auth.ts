// backend/src/middleware/auth.ts
// Reads Authorization: Bearer <token>, verifies it with JWT_SECRET, and sets
// req.user = { id, role, email, name }. Responds 401 on missing/invalid/expired.
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { AppError } from '../shared/appError';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
