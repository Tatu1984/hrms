import type { SalaryConfig } from '@prisma/client';

/**
 * Statutory payroll deduction calculation. Each deduction is toggleable: the
 * per-run override wins, else the SalaryConfig default, else a safe default.
 * Rates/ceilings come from SalaryConfig so admins control them from settings.
 */

export interface DeductionToggles {
  pf?: boolean;
  esi?: boolean;
  tds?: boolean;
  professionalTax?: boolean;
}

export interface StatutoryInput {
  /** Attendance-prorated basic pay (PF base). */
  basicPayable: number;
  /** Gross pay for the month (ESI base + TDS base). */
  grossSalary: number;
}

export interface StatutoryResult {
  pf: number;
  esi: number;
  tds: number;
  professionalTax: number;
}

interface TdsSlab {
  /** Upper bound of this annual slab, or null for the top open-ended slab. */
  upTo: number | null;
  /** Percentage applied to the portion of annual income in this slab. */
  rate: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type SalaryConfigLike = Pick<
  SalaryConfig,
  | 'pfPercentage'
  | 'esiPercentage'
  | 'esiWageCeiling'
  | 'professionalTax'
  | 'applyPf'
  | 'applyEsi'
  | 'applyTds'
  | 'applyProfessionalTax'
  | 'tdsSlabs'
>;

/**
 * Progressive monthly TDS from annual slabs. Annualizes the monthly gross,
 * applies each slab to its portion, divides the yearly tax back to a month.
 * Returns 0 when no slabs are configured.
 */
export function computeMonthlyTds(
  monthlyGross: number,
  slabs: TdsSlab[] | null | undefined,
): number {
  if (!slabs || slabs.length === 0) return 0;
  const annual = monthlyGross * 12;
  let tax = 0;
  let lower = 0;
  for (const slab of slabs) {
    const upper = slab.upTo ?? Infinity;
    if (annual <= lower) break;
    const taxable = Math.min(annual, upper) - lower;
    if (taxable > 0) tax += taxable * (slab.rate / 100);
    lower = upper;
  }
  return round2(tax / 12);
}

export function computeStatutoryDeductions(
  input: StatutoryInput,
  config: SalaryConfigLike | null,
  overrides?: DeductionToggles,
): StatutoryResult {
  const applyPf = overrides?.pf ?? config?.applyPf ?? false;
  const applyEsi = overrides?.esi ?? config?.applyEsi ?? false;
  const applyTds = overrides?.tds ?? config?.applyTds ?? false;
  const applyPt = overrides?.professionalTax ?? config?.applyProfessionalTax ?? true;

  const pfPct = config?.pfPercentage ?? 12;
  const esiPct = config?.esiPercentage ?? 0.75;
  const esiCeiling = config?.esiWageCeiling ?? 21000;
  const ptAmount = config?.professionalTax ?? 200;

  const pf = applyPf ? round2(input.basicPayable * (pfPct / 100)) : 0;
  // ESI only applies at/below the wage ceiling.
  const esi =
    applyEsi && input.grossSalary <= esiCeiling
      ? round2(input.grossSalary * (esiPct / 100))
      : 0;
  const tds = applyTds
    ? computeMonthlyTds(input.grossSalary, config?.tdsSlabs as TdsSlab[] | null)
    : 0;
  const professionalTax = applyPt ? ptAmount : 0;

  return { pf, esi, tds, professionalTax };
}
