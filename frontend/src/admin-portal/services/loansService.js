// src/admin-portal/services/loansService.js
import { http } from './http';

export const loansService = {
  // params: { overdue, user_id, from, to, page, limit } - see
  // backend/src/modules/circulation/dto/circulation.dto.ts loansQuery
  list: (params) => http.get('/circulation/loans', { params }).then((r) => r.data),
};
