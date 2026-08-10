// src/admin-portal/services/auditLogService.js
import { http } from './http';

export const auditLogService = {
  list: (params) => http.get('/audit-logs', { params }).then((r) => r.data),
};
