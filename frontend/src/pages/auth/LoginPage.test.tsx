// frontend/src/pages/auth/LoginPage.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '@/store/auth.store';

// Mock the API module so no network happens.
const post = vi.fn();
vi.mock('@/lib/api', () => ({
  api: { post: (...args: unknown[]) => post(...args) },
  apiErrorMessage: () => 'error',
}));

// Capture navigation.
const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Email'), 'user@uni.edu');
  await userEvent.type(screen.getByLabelText('Password'), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

beforeEach(() => {
  useAuthStore.getState().logout();
  navigate.mockClear();
  post.mockReset();
});

describe('LoginPage', () => {
  it('redirects a STUDENT to /student on successful login', async () => {
    post.mockResolvedValue({
      data: { data: { accessToken: 't', user: { id: '1', name: 'Ama', email: 'a@x', role: 'STUDENT' } } },
    });
    renderLogin();
    await fillAndSubmit();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/student', { replace: true }));
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'user@uni.edu', password: 'secret123' });
  });

  it('redirects an admin role to /admin on successful login', async () => {
    post.mockResolvedValue({
      data: { data: { accessToken: 't', user: { id: '2', name: 'Lib', email: 'l@x', role: 'LIBRARIAN' } } },
    });
    renderLogin();
    await fillAndSubmit();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin', { replace: true }));
  });

  it('shows a generic error on 401 without revealing the field', async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });
    renderLogin();
    await fillAndSubmit();
    expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument();
  });
});
