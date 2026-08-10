// src/admin-portal/services/reportsService.js
// Backs both DashboardPage and ReportsPage - same analytics endpoints, the
// dashboard reads them as "right now" and Reports adds date-range params where
// the endpoint accepts them. See backend/src/modules/analytics/analytics.routes.ts.
import { http } from './http';

export const reportsService = {
  dashboardStats: () => http.get('/analytics/dashboard-stats').then((r) => r.data),
  loanVolume: (params) => http.get('/analytics/loan-volume', { params }).then((r) => r.data),
  overdueRate: (params) => http.get('/analytics/overdue-rate', { params }).then((r) => r.data),
  topBorrowed: (params) => http.get('/analytics/top-borrowed', { params }).then((r) => r.data),
  borrowingByDept: () => http.get('/analytics/borrowing-by-dept').then((r) => r.data),
  recentActivity: () => http.get('/analytics/recent-activity').then((r) => r.data),
  // ADMINISTRATOR only - see backend/src/modules/analytics/analytics.routes.ts.
  staffActivity: (params) => http.get('/analytics/staff-activity', { params }).then((r) => r.data),
  acquisitionExpenditure: () => http.get('/analytics/acquisition-expenditure').then((r) => r.data),
};
