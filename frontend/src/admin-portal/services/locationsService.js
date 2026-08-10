// src/admin-portal/services/locationsService.js
import { http } from './http';

export const locationsService = {
  tree: () => http.get('/locations').then((r) => r.data),
  createLibrary: (name) => http.post('/locations', { name }).then((r) => r.data),
  createFloor: (libraryId, name) => http.post(`/locations/${libraryId}/floors`, { name }).then((r) => r.data),
  createSection: (floorId, name) => http.post(`/locations/floors/${floorId}/sections`, { name }).then((r) => r.data),
  createShelf: (sectionId, name) => http.post(`/locations/sections/${sectionId}/shelves`, { name }).then((r) => r.data),
  deleteShelf: (id) => http.delete(`/locations/shelves/${id}`).then((r) => r.data),
};
