// src/admin-portal/services/acquisitionsService.js
import { http } from './http';

export const acquisitionsService = {
  list: (params) => http.get('/acquisitions', { params }).then((r) => r.data),
  create: (payload) => http.post('/acquisitions', payload).then((r) => r.data),
  approve: (id) => http.put(`/acquisitions/${id}/approve`).then((r) => r.data),
  reject: (id, reason) => http.put(`/acquisitions/${id}/reject`, { reason }).then((r) => r.data),
  markOrdered: (id) => http.put(`/acquisitions/${id}/order`).then((r) => r.data),
  receive: (id, payload) => http.put(`/acquisitions/${id}/receive`, payload).then((r) => r.data),
};
