// backend/src/modules/users/users.controller.ts
import { Request, Response } from 'express';
import { usersService } from './users.service';
import { checkEligibility } from './eligibility';
import { sendSuccess, sendCreated } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';
import { rank } from '../../middleware/rbac';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

// LIBRARIAN+ or the resource owner may view another user's loans/fines/eligibility.
function assertSelfOrStaff(req: Request, targetId: string, minStaffRole: 'LIBRARIAN') {
  const user = requireUser(req);
  const isSelf = user.id === targetId;
  const isStaff = rank(user.role) >= rank(minStaffRole);
  if (!isSelf && !isStaff) throw new AppError('You do not have permission to view this resource', 403);
}

export const usersController = {
  async list(req: Request, res: Response): Promise<void> {
    const { items, meta } = await usersService.list(req.query as never);
    sendSuccess(res, items, 'Users', meta);
  },

  async create(req: Request, res: Response): Promise<void> {
    const { user, tempPassword } = await usersService.create(req.body);
    res.locals.audit = { entityType: 'User', entityId: (user as { id: string }).id, after: user };
    // The plaintext temp password is returned exactly once and never stored/logged.
    sendCreated(res, { user, tempPassword }, 'User created. Share the temporary password securely.');
  },

  async bulkImport(req: Request, res: Response): Promise<void> {
    const file = (req as Request & { file?: { buffer: Buffer } }).file;
    if (!file) throw new AppError('A CSV file is required (field name: file)', 422);
    const result = await usersService.bulkImport(file.buffer.toString('utf-8'));
    res.locals.audit = { entityType: 'User', after: { created: result.created } };
    sendCreated(
      res,
      result,
      `Imported ${result.created} student(s), skipped ${result.skipped.length}.`
    );
  },

  async update(req: Request, res: Response): Promise<void> {
    const user = await usersService.update(req.params.id, req.body);
    res.locals.audit = { entityType: 'User', entityId: req.params.id, after: user };
    sendSuccess(res, user, 'User updated');
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const user = await usersService.updateStatus(req.params.id, req.body);
    res.locals.audit = {
      entityType: 'User',
      entityId: req.params.id,
      after: { status: req.body.status, reason: req.body.reason },
    };
    sendSuccess(res, user, 'User status updated');
  },

  async updateRole(req: Request, res: Response): Promise<void> {
    const { before, after } = await usersService.updateRole(req.params.id, req.body);
    res.locals.audit = {
      entityType: 'User',
      entityId: req.params.id,
      before: { role: before },
      after: { role: after.role },
    };
    sendSuccess(res, after, 'User role updated');
  },

  async me(req: Request, res: Response): Promise<void> {
    const me = await usersService.getMe(requireUser(req).id);
    sendSuccess(res, me, 'Your profile');
  },

  async userLoans(req: Request, res: Response): Promise<void> {
    assertSelfOrStaff(req, req.params.id, 'LIBRARIAN');
    sendSuccess(res, await usersService.getUserLoans(req.params.id), 'Loans');
  },

  async userFines(req: Request, res: Response): Promise<void> {
    assertSelfOrStaff(req, req.params.id, 'LIBRARIAN');
    sendSuccess(res, await usersService.getUserFines(req.params.id), 'Fines');
  },

  async eligibility(req: Request, res: Response): Promise<void> {
    assertSelfOrStaff(req, req.params.id, 'LIBRARIAN');
    sendSuccess(res, await checkEligibility(req.params.id), 'Eligibility');
  },

  // ---- Own-resource convenience endpoints for the Student Portal --------------
  async myLoans(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await usersService.getUserLoans(requireUser(req).id), 'Your loans');
  },
  async myFines(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await usersService.getUserFines(requireUser(req).id), 'Your fines');
  },
  async myEligibility(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await checkEligibility(requireUser(req).id), 'Your eligibility');
  },
};
