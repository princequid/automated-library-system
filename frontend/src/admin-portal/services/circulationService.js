// src/admin-portal/services/circulationService.js
import { http } from './http';

export const circulationService = {
  issue: (payload) => http.post('/circulation/issue', payload).then((r) => r.data),
  return: (payload) => http.post('/circulation/return', payload).then((r) => r.data),
  renew: (payload) => http.post('/circulation/renew', payload).then((r) => r.data),
  reshelf: () => http.get('/circulation/reshelf').then((r) => r.data),
};
