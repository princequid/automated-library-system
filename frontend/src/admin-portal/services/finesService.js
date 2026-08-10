// src/admin-portal/services/finesService.js
// No batch endpoint exists for staff-side resolution - waive is one fine at a
// time (backend/src/modules/fines/fines.routes.ts). A "bulk waive" in the UI is
// genuinely N sequential calls to waiveOne; see OverduesPage for the honest
// per-item progress/partial-failure handling that requires.
import { http } from './http';

export const finesService = {
  list: (params) => http.get('/fines', { params }).then((r) => r.data),
  waiveOne: (id, payload) => http.put(`/fines/${id}/waive`, payload).then((r) => r.data),
  // payload is optional and only ever carries override_reason, for the
  // ADMINISTRATOR override path - a LIBRARIAN's call needs no body.
  payManual: (id, payload) => http.post(`/fines/${id}/pay-manual`, payload).then((r) => r.data),
  resolveDispute: (id, payload) => http.put(`/fines/${id}/resolve-dispute`, payload).then((r) => r.data),
};
