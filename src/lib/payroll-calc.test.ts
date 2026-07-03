import { describe, it, expect } from 'vitest';
import { computeStatutoryDeductions, computeMonthlyTds } from './payroll-calc';

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
