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

// ---------------------------------------------------------------------------
// Attendance -> absent-day counting (the manual Excel payroll model)
// ---------------------------------------------------------------------------

export interface AttendanceDay {
  date: Date | string;
  status: string;
}

export interface AbsentDaysInput {
  /** First day of the payroll month. */
  monthStart: Date;
  /** Last day to evaluate (min(today, month-end)); days after this aren't counted. */
  through: Date;
  /** Employee's joining date; days before this within the month are unpaid (absent). */
  joinDate: Date;
  /** Optional last working day; days after this are unpaid (absent). */
  leaveDate?: Date | null;
  attendance: AttendanceDay[];
}

/** Statuses that are paid and therefore never deducted. */
const PAID_STATUSES = new Set(['PRESENT', 'LEAVE', 'HOLIDAY', 'WEEKEND']);

function atMidnight(d: Date | string): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Count deductible ABSENT days for the month using the company rules:
 *
 *  - Salary is divided by a fixed 30; each absent day docks one day's pay.
 *  - Present days, approved paid leave, holidays, and "off" weekends are NOT
 *    deducted.
 *  - A weekday with no attendance record (or an ABSENT / unpaid-leave record)
 *    is absent. A HALF_DAY docks 0.5.
 *  - Weekend cascade: Saturday is deducted only if the preceding Friday is
 *    absent; Sunday only if the following Monday is absent. An off weekend
 *    whose adjacent weekday is present/paid is a paid off-day. A weekend the
 *    employee actually worked (PRESENT/HALF_DAY punch) is never deducted.
 *  - Days before joining (or after leaving) within the month are unpaid (absent).
 */
export function computeAbsentDays(input: AbsentDaysInput): number {
  const { monthStart, through, joinDate, leaveDate, attendance } = input;

  const statusByTime = new Map<number, string>();
  for (const a of attendance) statusByTime.set(atMidnight(a.date).getTime(), a.status);
  const statusOf = (d: Date): string | undefined => statusByTime.get(atMidnight(d).getTime());

  const start = atMidnight(monthStart);
  const end = atMidnight(through);
  const join = atMidnight(joinDate);
  const leave = leaveDate ? atMidnight(leaveDate) : null;

  const employed = (d: Date): boolean => d >= join && (!leave || d <= leave);

  // Is a WEEKDAY an absent (deductible) day?
  const weekdayAbsent = (d: Date): boolean => {
    if (!employed(d)) return true;
    const s = statusOf(d);
    if (s === undefined) return true; // working weekday with no punch => absent
    if (s === 'HALF_DAY') return false; // showed up (its own 0.5 is counted on its day)
    return !PAID_STATUSES.has(s); // ABSENT / LEAVE_UNPAID / etc.
  };

  let absent = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay(); // 0 = Sun, 6 = Sat
    if (!employed(cur)) {
      absent += 1;
    } else if (dow === 6 || dow === 0) {
      // Weekend. If actually worked, it's paid. Otherwise apply the cascade.
      const s = statusOf(cur);
      if (s !== 'PRESENT' && s !== 'HALF_DAY') {
        const adj = new Date(cur);
        adj.setDate(adj.getDate() + (dow === 6 ? -1 : 1)); // Sat->Fri, Sun->Mon
        if (weekdayAbsent(adj)) absent += 1;
      }
    } else {
      const s = statusOf(cur);
      if (s === 'HALF_DAY') absent += 0.5;
      else if (weekdayAbsent(cur)) absent += 1;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return absent;
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
  // Professional Tax is a flat levy on salary actually paid; if the month's
  // gross is 0 (e.g. no attendance), no PT is due — otherwise net pay would go
  // negative for a zero-earning month.
  const professionalTax = applyPt && input.grossSalary > 0 ? ptAmount : 0;

  return { pf, esi, tds, professionalTax };
}
