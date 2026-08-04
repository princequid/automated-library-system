// frontend/src/components/RouteGuard.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RouteGuard } from './RouteGuard';
import { useAuthStore, type AuthUser } from '@/store/auth.store';

function renderAt(path: string, requires: 'student' | 'admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <RouteGuard requires={requires}>
              <div>Protected content</div>
            </RouteGuard>
          }
        />
        <Route path="/login" element={<div>Login screen</div>} />
        <Route path="/student" element={<div>Student portal</div>} />
        <Route path="/admin" element={<div>Admin portal</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const student: AuthUser = { id: '1', name: 'Ama', email: 'a@x.edu', role: 'STUDENT' };
const librarian: AuthUser = { id: '2', name: 'Lib', email: 'l@x.edu', role: 'LIBRARIAN' };

beforeEach(() => useAuthStore.getState().logout());

describe('RouteGuard', () => {
  it('redirects an unauthenticated user to /login', () => {
    renderAt('/student', 'student');
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('redirects a STUDENT away from an /admin route to /student', () => {
    useAuthStore.getState().login(student, 'token');
    renderAt('/secret-admin', 'admin');
    expect(screen.getByText('Student portal')).toBeInTheDocument();
  });

  it('redirects an admin away from a /student route to /admin', () => {
    useAuthStore.getState().login(librarian, 'token');
    renderAt('/secret-student', 'student');
    expect(screen.getByText('Admin portal')).toBeInTheDocument();
  });

  it('renders the protected content when the role matches', () => {
    useAuthStore.getState().login(librarian, 'token');
    renderAt('/admin-area', 'admin');
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
