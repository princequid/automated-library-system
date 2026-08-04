// frontend/src/pages/student/BookDetailPage.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BookDetailPage } from './BookDetailPage';

const get = vi.fn();
vi.mock('@/lib/api', () => ({
  api: { get: (...args: unknown[]) => get(...args), post: vi.fn() },
  apiErrorMessage: () => 'error',
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/student/book/abc']}>
        <Routes>
          <Route path="/student/book/:id" element={<BookDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => get.mockReset());

describe('BookDetailPage', () => {
  it('disables Borrow and shows the exact API reason when the user is ineligible', async () => {
    get.mockImplementation((url = '') => {
      if (String(url).includes('/catalog/items/')) {
        return Promise.resolve({
          data: {
            data: {
              id: 'abc',
              title: 'Effective Java',
              author: 'Bloch',
              subject_tags: [],
              available_copies: 2,
              total_copies: 2,
              loan_period_days: 14,
              copies: [{ id: 'c1', barcode: 'B1', status: 'AVAILABLE' }],
            },
          },
        });
      }
      // eligibility
      return Promise.resolve({
        data: { data: { eligible: false, reason: 'Loan limit reached (5/5)', active_loans: 5, loan_limit: 5, outstanding_fines: 0, blocking_threshold: 10 } },
      });
    });

    renderPage();

    const borrowBtn = await screen.findByRole('button', { name: /borrow now/i });
    expect(borrowBtn).toBeDisabled();
    await waitFor(() => expect(screen.getByText('Loan limit reached (5/5)')).toBeInTheDocument());
  });
});
