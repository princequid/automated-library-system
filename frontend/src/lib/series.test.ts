// frontend/src/lib/series.test.ts
import { describe, it, expect } from 'vitest';
import { format, subDays } from 'date-fns';
import { fillLoanVolumeSeries, fillOverdueRateSeries, periodDelta } from './series';

describe('fillLoanVolumeSeries', () => {
  it('zero-fills every day in the window when the API returns a sparse series', () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const filled = fillLoanVolumeSeries([{ day: `${today}T00:00:00.000Z`, count: 4 }], 14);

    expect(filled).toHaveLength(14);
    expect(filled.filter((d) => d.count === 4)).toHaveLength(1);
    expect(filled.filter((d) => d.count === 0)).toHaveLength(13);
    expect(filled[filled.length - 1].count).toBe(4); // today is the last entry in the window
  });

  it('returns an all-zero series when the API returns nothing', () => {
    const filled = fillLoanVolumeSeries([], 7);
    expect(filled).toHaveLength(7);
    expect(filled.every((d) => d.count === 0)).toBe(true);
  });
});

describe('fillOverdueRateSeries', () => {
  it('zero-fills missing days', () => {
    const dayIso = subDays(new Date(), 3).toISOString();
    const filled = fillOverdueRateSeries([{ day: dayIso, rate: 75 }], 14);
    expect(filled).toHaveLength(14);
    expect(filled.filter((d) => d.rate === 75)).toHaveLength(1);
  });
});

describe('periodDelta', () => {
  it('returns null with fewer than 2 points', () => {
    expect(periodDelta([5])).toBeNull();
    expect(periodDelta([])).toBeNull();
  });

  it('returns null when the baseline (first half) is zero and there is no increase', () => {
    expect(periodDelta([0, 0, 0, 0])).toBeNull();
  });

  it('treats a rise from a zero baseline as a full increase', () => {
    expect(periodDelta([0, 0, 5, 5])).toBe(100);
  });

  it('computes a positive percentage change second-half vs first-half', () => {
    // first half sum = 10, second half sum = 20 -> +100%
    expect(periodDelta([5, 5, 10, 10])).toBe(100);
  });

  it('computes a negative percentage change', () => {
    // first half sum = 20, second half sum = 10 -> -50%
    expect(periodDelta([10, 10, 5, 5])).toBe(-50);
  });
});
