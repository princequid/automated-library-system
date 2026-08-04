// frontend/src/lib/format.test.ts
import { describe, it, expect } from 'vitest';
import { addDays, subDays } from 'date-fns';
import { dueUrgency, formatGhs, initials } from './format';

describe('dueUrgency', () => {
  it('flags an overdue loan as error', () => {
    const info = dueUrgency(subDays(new Date(), 3));
    expect(info.urgency).toBe('overdue');
    expect(info.badgeVariant).toBe('error');
    expect(info.label).toContain('overdue');
  });

  it('flags a loan due within 3 days as warning', () => {
    const info = dueUrgency(addDays(new Date(), 2));
    expect(info.urgency).toBe('soon');
    expect(info.badgeVariant).toBe('warning');
  });

  it('flags a comfortably-future loan as success', () => {
    const info = dueUrgency(addDays(new Date(), 10));
    expect(info.urgency).toBe('ok');
    expect(info.badgeVariant).toBe('success');
  });
});

describe('formatGhs / initials', () => {
  it('formats currency to 2dp', () => {
    expect(formatGhs(12.5)).toBe('GHS 12.50');
    expect(formatGhs('7')).toBe('GHS 7.00');
    expect(formatGhs(null)).toBe('GHS 0.00');
  });
  it('derives up to two initials', () => {
    expect(initials('Ama Mensah')).toBe('AM');
    expect(initials('Kwame')).toBe('K');
  });
});
