// src/admin-portal/services/staffService.js
// Staff = users with any non-STUDENT role. The backend's list endpoint
// (backend/src/modules/users/dto/user.dto.ts listUsersQuery) filters by exactly
// one role, not a set - there is no "role != STUDENT" or "role IN (...)" query.
// Faking that client-side by fetching unfiltered and dropping students would
// break the server-side pagination math (a page of 20 could shrink to 12 once
// students are stripped out). StaffPage therefore requires picking one of the
// two staff roles via a filter rather than offering a fabricated "All staff"
// view - it is a real backend constraint, not an oversight here.
import { usersService } from './usersService';

export const STAFF_ROLES = ['LIBRARIAN', 'ADMINISTRATOR'];

export const staffService = {
  list: (params) => usersService.list(params),
  create: usersService.create,
  setStatus: usersService.setStatus,
  setRole: usersService.setRole,
};
