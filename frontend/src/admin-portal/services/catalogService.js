// src/admin-portal/services/catalogService.js
// One module per resource, one function per backend endpoint. See
// backend/src/modules/catalog/catalog.routes.ts for the source of truth.
import { http } from './http';

export const catalogService = {
  list: (params) => http.get('/catalog/items', { params }).then((r) => r.data),
  get: (id) => http.get(`/catalog/items/${id}`).then((r) => r.data),
  create: (payload) => http.post('/catalog/items', payload).then((r) => r.data),
  update: (id, payload) => http.put(`/catalog/items/${id}`, payload).then((r) => r.data),
  remove: (id) => http.delete(`/catalog/items/${id}`).then((r) => r.data),
  listCopies: (id) => http.get(`/catalog/items/${id}/copies`).then((r) => r.data),
  addCopies: (id, payload) => http.post(`/catalog/items/${id}/copies`, payload).then((r) => r.data),
  updateCopy: (copyId, payload) => http.put(`/catalog/copies/${copyId}`, payload).then((r) => r.data),
  isbnLookup: (isbn) => http.get('/catalog/isbn-lookup', { params: { isbn } }).then((r) => r.data),
  bulkImport: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post('/catalog/bulk-import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
};
