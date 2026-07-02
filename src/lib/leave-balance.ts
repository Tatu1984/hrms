import { prisma } from '@/lib/db';
import type { LeaveType } from '@prisma/client';

/** UNPAID leave has no quota (unlimited, but unpaid). All other types are quota-limited. */
export function isPaidLeave(leaveType: LeaveType): boolean {
  return leaveType !== 'UNPAID';
}

/**
 * Balances are only *enforced* for leave types the admin has configured a policy
 * for. Until then, leave works as before (no blocking) while `used` still
 * accrues, so enabling a policy later reflects prior usage. Avoids locking
 * everyone out of leave the moment this ships with no quotas set.
 */
export async function isEnforced(
  leaveType: LeaveType,
  organizationId?: string | null,
): Promise<boolean> {
  if (!isPaidLeave(leaveType)) return false;
  // Policies are per-org, so a type is only "enforced" if the caller's org has
  // configured a policy for it.
  const policy = await prisma.leavePolicy.findFirst({
    where: { leaveType, ...(organizationId ? { organizationId } : {}) },
  });
  return !!policy;
}

/**
 * Fetch (or lazily create) the per-employee/year/type balance. New balances are
 * seeded with the admin-configured LeavePolicy annual quota for that type.
 */
export async function getOrCreateBalance(
  employeeId: string,
  year: number,
  leaveType: LeaveType,
) {
  const existing = await prisma.leaveBalance.findUnique({
    where: { employeeId_year_leaveType: { employeeId, year, leaveType } },
  });
  if (existing) return existing;

  // Resolve the employee's tenant first, then look up the policy within that org
  // (policies are per-org now that leaveType is no longer globally unique).
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { organizationId: true },
  });
  const policy = await prisma.leavePolicy.findFirst({
    where: {
      leaveType,
      ...(employee?.organizationId ? { organizationId: employee.organizationId } : {}),
    },
  });
  return prisma.leaveBalance.create({
    data: {
      employeeId,
      year,
      leaveType,
      allocated: policy?.annualQuota ?? 0,
      used: 0,
      // Inherit the employee's tenant so balances stay org-scoped.
      organizationId: employee?.organizationId ?? null,
    },
  });
}

export async function remainingBalance(
  employeeId: string,
  year: number,
  leaveType: LeaveType,
): Promise<number> {
  const bal = await getOrCreateBalance(employeeId, year, leaveType);
  return bal.allocated - bal.used;
}

/** Adjust `used` by delta (clamped at 0). Used +delta on approve, -delta on revert. */
export async function adjustUsed(
  employeeId: string,
  year: number,
  leaveType: LeaveType,
  delta: number,
) {
  const bal = await getOrCreateBalance(employeeId, year, leaveType);
  const used = Math.max(0, bal.used + delta);
  return prisma.leaveBalance.update({ where: { id: bal.id }, data: { used } });
}
