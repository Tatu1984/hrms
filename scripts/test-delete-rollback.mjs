// Non-destructive test of the employee-delete cascade.
// Runs the full delete transaction twice (old order vs. new order) and ALWAYS
// rolls back by throwing at the end. Proves leaveBalance was the FK blocker.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ROLLBACK = Symbol('rollback');

async function runDelete(employeeId, { includeLeaveBalance }) {
  try {
    await prisma.$transaction(async (tx) => {
      const attendanceRecords = await tx.attendance.findMany({
        where: { employeeId }, select: { id: true },
      });
      const attendanceIds = attendanceRecords.map(a => a.id);
      if (attendanceIds.length) {
        await tx.activityLog.deleteMany({ where: { attendanceId: { in: attendanceIds } } });
        await tx.break.deleteMany({ where: { attendanceId: { in: attendanceIds } } });
      }
      await tx.attendance.deleteMany({ where: { employeeId } });
      await tx.dailyWorkUpdate.deleteMany({ where: { employeeId } });
      await tx.employeeDocument.deleteMany({ where: { employeeId } });
      await tx.bankingDetails.deleteMany({ where: { employeeId } });
      await tx.leave.deleteMany({ where: { employeeId } });
      if (includeLeaveBalance) {
        await tx.leaveBalance.deleteMany({ where: { employeeId } });
      }
      await tx.message.deleteMany({ where: { senderId: employeeId } });
      await tx.payroll.deleteMany({ where: { employeeId } });
      await tx.projectMember.deleteMany({ where: { employeeId } });
      await tx.task.deleteMany({ where: { assignedTo: employeeId } });
      await tx.employee.updateMany({ where: { reportingHeadId: employeeId }, data: { reportingHeadId: null } });
      await tx.user.deleteMany({ where: { employeeId } });
      await tx.employee.delete({ where: { id: employeeId } });
      throw ROLLBACK; // never commit
    }, { timeout: 30000, maxWait: 30000 });
  } catch (e) {
    if (e === ROLLBACK) return { ok: true };
    return { ok: false, error: e.message };
  }
}

async function main() {
  // pick an employee that actually has leave balances (worst case for the FK)
  const withBalance = await prisma.leaveBalance.findFirst({ select: { employeeId: true } });
  const target = withBalance?.employeeId
    ?? (await prisma.employee.findFirst({ select: { id: true } }))?.id;

  if (!target) { console.log('No employees in this DB.'); return; }

  const emp = await prisma.employee.findUnique({
    where: { id: target },
    select: { name: true, employeeId: true, organizationId: true },
  });
  const lbCount = await prisma.leaveBalance.count({ where: { employeeId: target } });
  console.log(`Target: ${emp.name} (${emp.employeeId}) org=${emp.organizationId} — ${lbCount} leaveBalance rows\n`);

  const oldWay = await runDelete(target, { includeLeaveBalance: false });
  console.log(`OLD order (no leaveBalance delete): ${oldWay.ok ? 'OK' : 'FAILED — ' + oldWay.error}`);

  const newWay = await runDelete(target, { includeLeaveBalance: true });
  console.log(`NEW order (with leaveBalance delete): ${newWay.ok ? 'OK' : 'FAILED — ' + newWay.error}`);

  console.log('\n(no data was modified — both runs rolled back)');
}

main().finally(() => prisma.$disconnect());
