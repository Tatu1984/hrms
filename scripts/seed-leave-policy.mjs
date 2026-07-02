// Seeds default leave policy (Sick/Casual/Earned = 12) and backfills the current
// year's per-employee balances, computing `used` from already-approved leaves so
// enabling enforcement doesn't hand everyone a fresh allowance. Idempotent:
// re-runs keep `used` (only re-assert allocated).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PAID = ['SICK', 'CASUAL', 'EARNED'];
const QUOTA = 12;
const YEAR = new Date().getFullYear();

async function main() {
  for (const t of PAID) {
    await prisma.leavePolicy.upsert({
      where: { leaveType: t },
      create: { leaveType: t, annualQuota: QUOTA },
      update: { annualQuota: QUOTA },
    });
  }

  const employees = await prisma.employee.findMany({ select: { id: true } });
  const start = new Date(YEAR, 0, 1);
  const end = new Date(YEAR, 11, 31, 23, 59, 59);
  let created = 0;
  for (const e of employees) {
    for (const t of PAID) {
      const approved = await prisma.leave.findMany({
        where: { employeeId: e.id, leaveType: t, status: 'APPROVED', startDate: { gte: start, lte: end } },
        select: { days: true },
      });
      const used = approved.reduce((s, l) => s + l.days, 0);
      const existing = await prisma.leaveBalance.findUnique({
        where: { employeeId_year_leaveType: { employeeId: e.id, year: YEAR, leaveType: t } },
      });
      if (existing) {
        await prisma.leaveBalance.update({ where: { id: existing.id }, data: { allocated: QUOTA } });
      } else {
        await prisma.leaveBalance.create({
          data: { employeeId: e.id, year: YEAR, leaveType: t, allocated: QUOTA, used },
        });
        created++;
      }
    }
  }
  console.log(`Policies set (${QUOTA} each). Backfilled ${created} balance rows for ${employees.length} employees, year ${YEAR}.`);
}

main().finally(() => prisma.$disconnect());
