// backend/src/middleware/rbac.test.ts
import { Request, Response } from 'express';
import { requireRole, requireAtLeast, requireLibrarianOrOverride, requireOverrideIfAdministrator } from './rbac';
import { AppError } from '../shared/appError';

function run(mw: ReturnType<typeof requireRole>, role?: string, body?: Record<string, unknown>) {
  const req = { user: role ? { role } : undefined, body: body ?? {} } as unknown as Request;
  const next = jest.fn();
  mw(req, {} as Response, next);
  return { err: next.mock.calls[0]?.[0], req };
}

describe('rbac', () => {
  it('rejects a role not in the allowed list with 403', () => {
    const { err } = run(requireRole('LIBRARIAN', 'ADMINISTRATOR'), 'STUDENT');
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(403);
  });

  it('allows a role that is in the list', () => {
    const { err } = run(requireRole('LIBRARIAN'), 'LIBRARIAN');
    expect(err).toBeUndefined();
  });

  it('returns 401 when there is no authenticated user', () => {
    const { err } = run(requireRole('LIBRARIAN'));
    expect((err as AppError).statusCode).toBe(401);
  });

  it('requireAtLeast(LIBRARIAN) permits ADMINISTRATOR but not STUDENT', () => {
    expect(run(requireAtLeast('LIBRARIAN'), 'ADMINISTRATOR').err).toBeUndefined();
    expect((run(requireAtLeast('LIBRARIAN'), 'STUDENT').err as AppError).statusCode).toBe(403);
  });

  describe('requireLibrarianOrOverride', () => {
    it('passes LIBRARIAN unconditionally, with no override flag set', () => {
      const { err, req } = run(requireLibrarianOrOverride(), 'LIBRARIAN');
      expect(err).toBeUndefined();
      expect(req.isOverride).toBeUndefined();
    });

    it('rejects ADMINISTRATOR with 400 when override_reason is missing', () => {
      const { err } = run(requireLibrarianOrOverride(), 'ADMINISTRATOR');
      expect((err as AppError).statusCode).toBe(400);
    });

    it('rejects ADMINISTRATOR with 400 when override_reason is blank', () => {
      const { err } = run(requireLibrarianOrOverride(), 'ADMINISTRATOR', { override_reason: '   ' });
      expect((err as AppError).statusCode).toBe(400);
    });

    it('passes ADMINISTRATOR and stamps the reason when override_reason is supplied', () => {
      const { err, req } = run(requireLibrarianOrOverride(), 'ADMINISTRATOR', { override_reason: 'Desk unattended' });
      expect(err).toBeUndefined();
      expect(req.isOverride).toBe(true);
      expect(req.overrideReason).toBe('Desk unattended');
    });

    it('rejects STUDENT with 403', () => {
      const { err } = run(requireLibrarianOrOverride(), 'STUDENT');
      expect((err as AppError).statusCode).toBe(403);
    });
  });

  describe('requireOverrideIfAdministrator', () => {
    it('passes STUDENT and LIBRARIAN through untouched', () => {
      expect(run(requireOverrideIfAdministrator(), 'STUDENT').err).toBeUndefined();
      expect(run(requireOverrideIfAdministrator(), 'LIBRARIAN').err).toBeUndefined();
    });

    it('requires override_reason for ADMINISTRATOR', () => {
      const { err } = run(requireOverrideIfAdministrator(), 'ADMINISTRATOR');
      expect((err as AppError).statusCode).toBe(400);
    });

    it('stamps the reason for ADMINISTRATOR when supplied', () => {
      const { err, req } = run(requireOverrideIfAdministrator(), 'ADMINISTRATOR', { override_reason: 'Covering the desk' });
      expect(err).toBeUndefined();
      expect(req.isOverride).toBe(true);
      expect(req.overrideReason).toBe('Covering the desk');
    });
  });
});
