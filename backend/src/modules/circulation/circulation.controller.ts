// backend/src/modules/circulation/circulation.controller.ts
import { Request, Response } from 'express';
import { circulationService } from './circulation.service';
import { sendSuccess, sendCreated } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

export const circulationController = {
  async issue(req: Request, res: Response): Promise<void> {
    const staff = requireUser(req);
    const loan = await circulationService.issue(req.body.copy_id, req.body.user_id, staff.id);
    res.locals.audit = { entityType: 'Loan', entityId: loan?.id, after: loan };
    sendCreated(res, loan, 'Book issued');
  },

  async selfBorrow(req: Request, res: Response): Promise<void> {
    const student = requireUser(req);
    // user_id is ALWAYS the authenticated student - never read from the body.
    const loan = await circulationService.selfBorrow(req.body.copy_id, student.id);
    res.locals.audit = { entityType: 'Loan', entityId: loan?.id, after: loan };
    sendCreated(res, loan, 'Borrowed successfully');
  },

  async returnBook(req: Request, res: Response): Promise<void> {
    requireUser(req);
    const result = await circulationService.returnByBarcode(req.body.barcode);
    res.locals.audit = { entityType: 'Loan', entityId: result.loan?.id, after: result };
    sendSuccess(res, result, result.fine ? 'Returned with an overdue fine' : 'Returned');
  },

  async renew(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const loan = await circulationService.renew(req.body.loan_id, user);
    res.locals.audit = { entityType: 'Loan', entityId: loan.id, after: loan };
    sendSuccess(res, loan, 'Loan renewed');
  },

  async listLoans(req: Request, res: Response): Promise<void> {
    const { items, meta } = await circulationService.listLoans(req.query as never);
    sendSuccess(res, items, 'Loans', meta);
  },

  async reshelf(req: Request, res: Response): Promise<void> {
    requireUser(req);
    sendSuccess(res, await circulationService.reshelfList(), 'Reshelf list');
  },
};
