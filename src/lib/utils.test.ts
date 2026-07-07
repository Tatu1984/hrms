import { describe, it, expect } from 'vitest';
import {
  calculateWorkingHours,
  calculateLeaveDays,
  formatHoursMinutes,
  getMonthName,
} from './utils';

describe('calculateWorkingHours', () => {
  it('returns elapsed hours between punch in and out', () => {
    expect(calculateWorkingHours('2024-01-01T09:00:00Z', '2024-01-01T17:00:00Z')).toBe(8);
  });

  it('subtracts a break window when supplied', () => {
    expect(
      calculateWorkingHours(
        '2024-01-01T09:00:00Z',
        '2024-01-01T17:00:00Z',
        '2024-01-01T13:00:00Z',
        '2024-01-01T14:00:00Z',
      ),
    ).toBe(7);
  });

  it('rounds to 2 decimals', () => {
    // 30 minutes => 0.5h
    expect(calculateWorkingHours('2024-01-01T09:00:00Z', '2024-01-01T09:30:00Z')).toBe(0.5);
  });
});

describe('calculateLeaveDays (inclusive of both endpoints)', () => {
  it('counts a single day as 1', () => {
    expect(calculateLeaveDays('2024-01-01', '2024-01-01')).toBe(1);
  });

  it('counts an inclusive multi-day span', () => {
    // Jan 1 through Jan 3 inclusive = 3 days
    expect(calculateLeaveDays('2024-01-01', '2024-01-03')).toBe(3);
  });

  it('uses abs() so a reversed range still yields a positive count', () => {
    expect(calculateLeaveDays('2024-01-03', '2024-01-01')).toBe(3);
  });
});

describe('formatHoursMinutes', () => {
  it('returns a dash for null/undefined and 0:00 for zero', () => {
    expect(formatHoursMinutes(null)).toBe('-');
    expect(formatHoursMinutes(undefined)).toBe('-');
    expect(formatHoursMinutes(0)).toBe('0:00');
  });

  it('formats decimal hours as H:MM with zero-padded minutes', () => {
    expect(formatHoursMinutes(1.5)).toBe('1:30');
    expect(formatHoursMinutes(2.75)).toBe('2:45');
    expect(formatHoursMinutes(2.05)).toBe('2:03'); // 0.05*60 = 3 min
  });

  it('handles the 60-minute rounding edge by rolling into the next hour', () => {
    expect(formatHoursMinutes(1.999)).toBe('2:00');
  });

  it('formats negatives with a leading minus', () => {
    expect(formatHoursMinutes(-1.5)).toBe('-1:30');
  });
});

describe('getMonthName', () => {
  it('maps 1..12 to month names', () => {
    expect(getMonthName(1)).toBe('January');
    expect(getMonthName(12)).toBe('December');
  });

  it('returns undefined for out-of-range indices (characterization)', () => {
    expect(getMonthName(0)).toBeUndefined();
    expect(getMonthName(13)).toBeUndefined();
  });
});
