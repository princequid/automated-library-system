// frontend/src/lib/series.ts
// Chart-data shaping for the Dashboard/Analytics day-series endpoints. The API
// returns SPARSE rows (only days with at least one event) - a 14-day trend chart
// fed that directly collapses into a single giant bar instead of 14 daily ones.
// These fill the gaps with zeros so every day in the window gets a slot.
import { eachDayOfInterval, subDays, format, startOfDay } from 'date-fns';

function dayRange(days: number) {
  const today = startOfDay(new Date());
  return eachDayOfInterval({ start: subDays(today, days - 1), end: today });
}

export function fillLoanVolumeSeries(data: { day: string; count: number }[], days = 14) {
  const byDay = new Map(data.map((d) => [format(startOfDay(new Date(d.day)), 'yyyy-MM-dd'), d.count]));
  return dayRange(days).map((day) => ({
    label: format(day, 'd MMM'),
    count: byDay.get(format(day, 'yyyy-MM-dd')) ?? 0,
  }));
}

export function fillOverdueRateSeries(data: { day: string; rate: number }[], days = 14) {
  const byDay = new Map(data.map((d) => [format(startOfDay(new Date(d.day)), 'yyyy-MM-dd'), d.rate]));
  return dayRange(days).map((day) => ({
    label: format(day, 'd MMM'),
    rate: byDay.get(format(day, 'yyyy-MM-dd')) ?? 0,
  }));
}

/**
 * Percentage change between the second half and first half of a series - a simple
 * "vs previous period" delta computed entirely client-side from data already being
 * fetched, so KPI trends don't require a new backend endpoint. Returns null when
 * there isn't enough data (or no baseline) to compare against.
 */
export function periodDelta(values: number[]): number | null {
  if (values.length < 2) return null;
  const mid = Math.floor(values.length / 2);
  const prev = values.slice(0, mid).reduce((a, b) => a + b, 0);
  const curr = values.slice(mid).reduce((a, b) => a + b, 0);
  if (prev === 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / prev) * 100;
}
