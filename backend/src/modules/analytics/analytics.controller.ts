// backend/src/modules/analytics/analytics.controller.ts
import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../shared/responseHelper';

function range(req: Request) {
  return { from: req.query.from as string | undefined, to: req.query.to as string | undefined };
}

export const analyticsController = {
  async loanVolume(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.loanVolume(range(req)), 'Loan volume');
  },
  async topBorrowed(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.topBorrowed(range(req)), 'Top borrowed');
  },
  async borrowingByDept(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.borrowingByDept(), 'Borrowing by department');
  },
  async overdueRate(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.overdueRate(range(req)), 'Overdue rate');
  },
  async fineCollection(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.fineCollection(range(req)), 'Fine collection');
  },
  async dashboardStats(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.dashboardStats(), 'Dashboard stats');
  },
  async recentActivity(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.recentActivity(), 'Recent activity');
  },
  async staffActivity(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.staffActivity(range(req)), 'Staff activity');
  },
  async acquisitionExpenditure(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await analyticsService.acquisitionExpenditure(), 'Acquisition expenditure');
  },
};
