// src/admin-portal/services/usersService.js
// Shared base for Members and Staff - both are GET /users with a different
// role filter (backend/src/modules/users/users.routes.ts). membersService and
// staffService below are thin, differently-scoped wrappers over this so the
// raw endpoint call exists exactly once.
import { http } from './http';

export const usersService = {
  list: (params) => http.get('/users', { params }).then((r) => r.data),
  create: (payload) => http.post('/users', payload).then((r) => r.data),
  update: (id, payload) => http.put(`/users/${id}`, payload).then((r) => r.data),
  setStatus: (id, payload) => http.put(`/users/${id}/status`, payload).then((r) => r.data),
  setRole: (id, role) => http.put(`/users/${id}/role`, { role }).then((r) => r.data),
  loans: (id) => http.get(`/users/${id}/loans`).then((r) => r.data),
  fines: (id) => http.get(`/users/${id}/fines`).then((r) => r.data),
  eligibility: (id) => http.get(`/users/${id}/eligibility`).then((r) => r.data),
};
