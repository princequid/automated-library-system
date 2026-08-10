// backend/src/modules/analytics/analytics.routes.ts
import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireRole } from '../../middleware/rbac';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
router.use(authenticate, requireAtLeast('LIBRARIAN'));

/**
 * @swagger
 * /analytics/dashboard-stats:
 *   get:
 *     tags: [Analytics]
 *     summary: The four dashboard headline numbers (LIBRARIAN+)
 *     responses: { 200: { description: activeLoans, overdueCount, finesCollectedThisMonth, itemsAddedThisWeek } }
 */
router.get('/dashboard-stats', asyncHandler(analyticsController.dashboardStats));

/**
 * @swagger
 * /analytics/loan-volume:
 *   get:
 *     tags: [Analytics]
 *     summary: Loans grouped by day (LIBRARIAN+)
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses: { 200: { description: Daily loan counts } }
 */
router.get('/loan-volume', asyncHandler(analyticsController.loanVolume));

/**
 * @swagger
 * /analytics/top-borrowed:
 *   get:
 *     tags: [Analytics]
 *     summary: Top 10 titles by loan count (LIBRARIAN+)
 *     responses: { 200: { description: Ranked titles } }
 */
router.get('/top-borrowed', asyncHandler(analyticsController.topBorrowed));

/**
 * @swagger
 * /analytics/borrowing-by-dept:
 *   get:
 *     tags: [Analytics]
 *     summary: Loan counts grouped by department (LIBRARIAN+)
 *     responses: { 200: { description: Counts per department } }
 */
router.get('/borrowing-by-dept', asyncHandler(analyticsController.borrowingByDept));

/**
 * @swagger
 * /analytics/overdue-rate:
 *   get:
 *     tags: [Analytics]
 *     summary: Overdue percentage of active loans over time (LIBRARIAN+)
 *     responses: { 200: { description: Overdue rate series } }
 */
router.get('/overdue-rate', asyncHandler(analyticsController.overdueRate));

/**
 * @swagger
 * /analytics/fine-collection:
 *   get:
 *     tags: [Analytics]
 *     summary: Fines posted vs collected per month (LIBRARIAN+)
 *     responses: { 200: { description: Posted vs collected } }
 */
router.get('/fine-collection', asyncHandler(analyticsController.fineCollection));

/**
 * @swagger
 * /analytics/recent-activity:
 *   get:
 *     tags: [Analytics]
 *     summary: Latest loans/returns for the dashboard table (LIBRARIAN+)
 *     responses: { 200: { description: Recent activity } }
 */
router.get('/recent-activity', asyncHandler(analyticsController.recentActivity));

/**
 * @swagger
 * /analytics/staff-activity:
 *   get:
 *     tags: [Analytics]
 *     summary: Action counts per staff member, including override actions (ADMINISTRATOR only)
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses: { 200: { description: Per-actor activity counts } }
 */
router.get('/staff-activity', requireRole('ADMINISTRATOR'), asyncHandler(analyticsController.staffActivity));

/**
 * @swagger
 * /analytics/acquisition-expenditure:
 *   get:
 *     tags: [Analytics]
 *     summary: Total spend on received acquisitions plus pending request count (ADMINISTRATOR only)
 *     responses: { 200: { description: Expenditure summary } }
 */
router.get('/acquisition-expenditure', requireRole('ADMINISTRATOR'), asyncHandler(analyticsController.acquisitionExpenditure));

export const analyticsRoutes = router;
