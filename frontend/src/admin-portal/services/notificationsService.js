// src/admin-portal/services/notificationsService.js
import { http } from './http';

export const notificationsService = {
  list: (unreadOnly) => http.get('/notifications/me', { params: { unread_only: unreadOnly } }).then((r) => r.data),
  markRead: (id) => http.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => http.put('/notifications/read-all').then((r) => r.data),
};
