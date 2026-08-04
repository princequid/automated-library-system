// src/admin-portal/services/membersService.js
// Members = users with role STUDENT. Thin wrapper over usersService so
// MembersPage never has to know or repeat that filter.
import { usersService } from './usersService';

export const membersService = {
  list: (params) => usersService.list({ ...params, role: 'STUDENT' }),
  create: (payload) => usersService.create({ ...payload, role: 'STUDENT' }),
  update: usersService.update,
  setStatus: usersService.setStatus,
  loans: usersService.loans,
  fines: usersService.fines,
  eligibility: usersService.eligibility,
};
