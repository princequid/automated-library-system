// src/admin-portal/services/finesService.js
// No batch endpoint exists for staff-side resolution - waive is one fine at a
// time (backend/src/modules/fines/fines.routes.ts). A "bulk waive" in the UI is
// genuinely N sequential calls to waiveOne; see OverduesPage for the honest
// per-item progress/partial-failure handling that requires.
import { http } from './http';

export const finesService = {
  list: (params) => http.get('/fines', { params }).then((r) => r.data),
  waiveOne: (id, payload) => http.put(`/fines/${id}/waive`, payload).then((r) => r.data),
};
