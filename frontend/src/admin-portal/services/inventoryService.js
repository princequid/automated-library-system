// src/admin-portal/services/inventoryService.js
import { http } from './http';

export const inventoryService = {
  list: () => http.get('/inventory/sessions').then((r) => r.data),
  getOne: (id) => http.get(`/inventory/sessions/${id}`).then((r) => r.data),
  start: (payload) => http.post('/inventory/sessions', payload).then((r) => r.data),
  scan: (id, barcode) => http.post(`/inventory/sessions/${id}/scan`, { barcode }).then((r) => r.data),
  complete: (id) => http.put(`/inventory/sessions/${id}/complete`).then((r) => r.data),
  markMissingAsLost: (id, copyIds) =>
    http.put(`/inventory/sessions/${id}/mark-lost`, { copy_ids: copyIds }).then((r) => r.data),
};
