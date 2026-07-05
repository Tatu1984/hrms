import { describe, it, expect } from 'vitest';
import { computeStatutoryDeductions, computeMonthlyTds, computeAbsentDays } from './payroll-calc';

// January 2024: Jan 1 is a Monday, so weekdays/weekends are deterministic.
const JAN = (day: number) => new Date(2024, 0, day);
const WEEKDAYS = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30, 31];
const present = (days: number[], status = 'PRESENT') => days.map((d) => ({ date: JAN(d), status }));
const monthBase = { monthStart: JAN(1), through: JAN(31), joinDate: JAN(1), leaveDate: null as Date | null };

describe('computeAbsentDays (Excel model: /30, deduct absent; weekend cascade)', () => {
  it('full month of present weekdays => 0 absent (weekends paid via cascade)', () => {
    expect(computeAbsentDays({ ...monthBase, attendance: present(WEEKDAYS) })).toBe(0);
  });

  it('Friday absent => that Friday AND the following Saturday are absent (2)', () => {
    const att = present(WEEKDAYS.filter((d) => d !== 5)).concat([{ date: JAN(5), status: 'ABSENT' }]);
    expect(computeAbsentDays({ ...monthBase, attendance: att })).toBe(2);
  });

  it('Monday absent => that Monday AND the preceding Sunday are absent (2)', () => {
    const att = present(WEEKDAYS.filter((d) => d !== 8)).concat([{ date: JAN(8), status: 'ABSENT' }]);
    expect(computeAbsentDays({ ...monthBase, attendance: att })).toBe(2);
  });

  it('a half day docks 0.5', () => {
    const att = present(WEEKDAYS.filter((d) => d !== 3)).concat([{ date: JAN(3), status: 'HALF_DAY' }]);
    expect(computeAbsentDays({ ...monthBase, attendance: att })).toBe(0.5);
  });

  it('no attendance at all => every weekday absent and every weekend cascaded (31)', () => {
    expect(computeAbsentDays({ ...monthBase, attendance: [] })).toBe(31);
  });

  it('a weekend actually worked is not deducted even if the adjacent weekday is absent', () => {
    // Fri absent (1) but Sat worked (0); Sun paid (Mon present) => total 1
    const att = present(WEEKDAYS.filter((d) => d !== 5)).concat([
      { date: JAN(5), status: 'ABSENT' },
      { date: JAN(6), status: 'PRESENT' },
    ]);
    expect(computeAbsentDays({ ...monthBase, attendance: att })).toBe(1);
  });

  it('days before joining are unpaid (mid-month joiner)', () => {
    // Joins Jan 15; Jan 1-14 (14 days) are pre-join => absent, rest present.
    expect(computeAbsentDays({ ...monthBase, joinDate: JAN(15), attendance: present(WEEKDAYS) })).toBe(14);
  });

  it('approved paid leave and holidays are not deducted', () => {
    const att = present(WEEKDAYS.filter((d) => d !== 4 && d !== 11))
      .concat([{ date: JAN(4), status: 'LEAVE' }, { date: JAN(11), status: 'HOLIDAY' }]);
    expect(computeAbsentDays({ ...monthBase, attendance: att })).toBe(0);
  });

  it('unpaid leave IS deducted', () => {
    const att = present(WEEKDAYS.filter((d) => d !== 4)).concat([{ date: JAN(4), status: 'LEAVE_UNPAID' }]);
    expect(computeAbsentDays({ ...monthBase, attendance: att })).toBe(1);
  });
});

const baseConfig = {
  pfPercentage: 12,
  esiPercentage: 0.75,
  esiWageCeiling: 21000,
  professionalTax: 200,
  applyPf: false,
  applyEsi: false,
  applyTds: false,
  applyProfessionalTax: true,
  tdsSlabs: null,
};

describe('computeStatutoryDeductions', () => {
  it('applies only professional tax by default', () => {
    const r = computeStatutoryDeductions({ basicPayable: 50000, grossSalary: 60000 }, baseConfig);
    expect(r).toEqual({ pf: 0, esi: 0, tds: 0, professionalTax: 200 });
  });

  it('computes PF on basic when enabled', () => {
    const r = computeStatutoryDeductions(
      { basicPayable: 50000, grossSalary: 60000 },
      { ...baseConfig, applyPf: true },
    );
    expect(r.pf).toBe(6000); // 12% of 50000
  });

  it('applies ESI only at/below the wage ceiling', () => {
    const below = computeStatutoryDeductions(
      { basicPayable: 15000, grossSalary: 20000 },
      { ...baseConfig, applyEsi: true },
    );
    expect(below.esi).toBeCloseTo(150, 2); // 0.75% of 20000

    const above = computeStatutoryDeductions(
      { basicPayable: 40000, grossSalary: 60000 },
      { ...baseConfig, applyEsi: true },
    );
    expect(above.esi).toBe(0); // gross above 21000 ceiling
  });

  it('does not levy professional tax on a zero-gross month (no negative net)', () => {
    const r = computeStatutoryDeductions({ basicPayable: 0, grossSalary: 0 }, baseConfig);
    expect(r.professionalTax).toBe(0);
    expect(r).toEqual({ pf: 0, esi: 0, tds: 0, professionalTax: 0 });
  });

  it('per-run overrides win over config defaults', () => {
    const r = computeStatutoryDeductions(
      { basicPayable: 50000, grossSalary: 60000 },
      { ...baseConfig, applyProfessionalTax: true },
      { professionalTax: false },
    );
    expect(r.professionalTax).toBe(0);
  });
});

describe('computeMonthlyTds', () => {
  it('returns 0 with no slabs', () => {
    expect(computeMonthlyTds(50000, null)).toBe(0);
    expect(computeMonthlyTds(50000, [])).toBe(0);
  });

  it('applies progressive slabs on annualized income', () => {
    // 50000/mo => 600000/yr. Slabs: 0-250000 @0%, 250000-500000 @5%, 500000+ @20%
    const slabs = [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 5 },
      { upTo: null, rate: 20 },
    ];
    // tax = 0 + (250000*5%) + (100000*20%) = 12500 + 20000 = 32500 /yr => 2708.33/mo
    expect(computeMonthlyTds(50000, slabs)).toBeCloseTo(2708.33, 1);
  });
});
