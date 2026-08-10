// src/admin-portal/services/reservationsService.js
import { http } from './http';

export const reservationsService = {
  list: (params) => http.get('/reservations', { params }).then((r) => r.data),
  cancel: (id) => http.delete(`/reservations/${id}`).then((r) => r.data),
};
