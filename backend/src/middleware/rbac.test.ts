// backend/src/middleware/rbac.test.ts
import { Request, Response } from 'express';
import { requireRole, requireAtLeast } from './rbac';
import { AppError } from '../shared/appError';

function run(mw: ReturnType<typeof requireRole>, role?: string) {
  const req = { user: role ? { role } : undefined } as unknown as Request;
  const next = jest.fn();
  mw(req, {} as Response, next);
  return next.mock.calls[0]?.[0];
}

describe('rbac', () => {
  it('rejects a role not in the allowed list with 403', () => {
    const err = run(requireRole('LIBRARIAN', 'SUPER_ADMIN'), 'STUDENT');
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(403);
  });

  it('allows a role that is in the list', () => {
    const err = run(requireRole('LIBRARIAN'), 'LIBRARIAN');
    expect(err).toBeUndefined();
  });

  it('returns 401 when there is no authenticated user', () => {
    const err = run(requireRole('LIBRARIAN'));
    expect((err as AppError).statusCode).toBe(401);
  });

  it('requireAtLeast(LIBRARIAN) permits SENIOR_LIBRARIAN but not DESK_STAFF', () => {
    expect(run(requireAtLeast('LIBRARIAN'), 'SENIOR_LIBRARIAN')).toBeUndefined();
    expect((run(requireAtLeast('LIBRARIAN'), 'DESK_STAFF') as AppError).statusCode).toBe(403);
  });
});
