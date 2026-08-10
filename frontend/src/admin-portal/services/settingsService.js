// src/admin-portal/services/settingsService.js
import { http } from './http';

export const settingsService = {
  list: () => http.get('/settings').then((r) => r.data),
  setMany: (updates) => http.put('/settings', { updates }).then((r) => r.data),
};
