// src/admin-portal/services/maintenanceService.js
import { http } from './http';

export const maintenanceService = {
  list: (params) => http.get('/maintenance', { params }).then((r) => r.data),
  open: (payload) => http.post('/maintenance', payload).then((r) => r.data),
  resolve: (id, payload) => http.put(`/maintenance/${id}/resolve`, payload).then((r) => r.data),
};
