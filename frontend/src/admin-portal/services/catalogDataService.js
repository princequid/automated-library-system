// src/admin-portal/services/catalogDataService.js
// Authors/Publishers/Categories are three near-identical CRUD surfaces on the
// backend (backend/src/modules/catalogData/*) - one small factory here mirrors
// that instead of writing the same five lines three times.
import { http } from './http';

function makeCrud(basePath) {
  return {
    list: () => http.get(basePath).then((r) => r.data),
    create: (payload) => http.post(basePath, payload).then((r) => r.data),
    update: (id, payload) => http.put(`${basePath}/${id}`, payload).then((r) => r.data),
    remove: (id) => http.delete(`${basePath}/${id}`).then((r) => r.data),
  };
}

export const authorsService = makeCrud('/authors');
export const publishersService = makeCrud('/publishers');
export const categoriesService = makeCrud('/categories');
