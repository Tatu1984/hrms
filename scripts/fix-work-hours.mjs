/**
 * Script to fix work hours calculation for all historical attendance records
 *
 * New formula:
 * - Work Hours = Total Elapsed - Break - Idle
 * - If Idle > 1 hour: Work Hours = Work Hours - (Idle - 1) [penalty for excessive idle]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function calculateIdleTime(attendanceId) {
  const inactiveCount = await prisma.activityLog.count({
    where: {
      attendanceId,
      active: false,
      source: 'client',
    },
  });

  // Each inactive heartbeat represents 3 minutes
  const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000;
  const totalIdleMs = inactiveCount * HEARTBEAT_INTERVAL_MS;
  return totalIdleMs / (1000 * 60 * 60); // Convert to hours
}

async function main() {
  console.log('Starting work hours recalculation...\n');

  // Get all attendance records with punch times
  const records = await prisma.attendance.findMany({
    where: {
      punchIn: { not: null },
      punchOut: { not: null },
    },
    include: {
      employee: {
        select: {
          employeeId: true,
          name: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  console.log(`Found ${records.length} attendance records to process\n`);

  let fixedCount = 0;
  const results = [];

  for (const record of records) {
    const punchInTime = new Date(record.punchIn).getTime();
    const punchOutTime = new Date(record.punchOut).getTime();
    const totalElapsedHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);
    const breakDuration = record.breakDuration || 0;

    // Recalculate idle time from activity logs
    const idleTime = await calculateIdleTime(record.id);

    // New formula: Work = Total - Break - Idle
    let actualWorkHours = totalElapsedHours - breakDuration - idleTime;

    // Apply idle penalty: if idle > 1 hour, deduct excess
    const idlePenalty = Math.max(0, idleTime - 1);
    const newWorkHours = Math.max(0, actualWorkHours - idlePenalty);

    const oldWorkHours = record.totalHours || 0;
    const oldIdleTime = record.idleTime || 0;

    // Check if values need updating
    const workHoursChanged = Math.abs(newWorkHours - oldWorkHours) > 0.01;
    const idleTimeChanged = Math.abs(idleTime - oldIdleTime) > 0.01;

    if (workHoursChanged || idleTimeChanged) {
      await prisma.attendance.update({
        where: { id: record.id },
        data: {
          totalHours: Math.round(newWorkHours * 100) / 100,
          idleTime: Math.round(idleTime * 100) / 100,
        },
      });

      fixedCount++;
      results.push({
        employee: `${record.employee.employeeId} (${record.employee.name})`,
        date: record.date.toISOString().split('T')[0],
        totalElapsed: totalElapsedHours.toFixed(2),
        break: breakDuration.toFixed(2),
        idle: `${oldIdleTime.toFixed(2)} -> ${idleTime.toFixed(2)}`,
        idlePenalty: idlePenalty.toFixed(2),
        workHours: `${oldWorkHours.toFixed(2)} -> ${newWorkHours.toFixed(2)}`,
      });
    }
  }

  console.log(`\nFixed ${fixedCount} out of ${records.length} records\n`);

  if (results.length > 0) {
    console.log('Changes made:');
    console.table(results);
  } else {
    console.log('All records already have correct values.');
  }

  // Summary statistics
  const summary = await prisma.attendance.aggregate({
    _avg: {
      totalHours: true,
      breakDuration: true,
      idleTime: true,
    },
    _sum: {
      totalHours: true,
      breakDuration: true,
      idleTime: true,
    },
    where: {
      status: { in: ['PRESENT', 'HALF_DAY'] },
    },
  });

  console.log('\nUpdated Summary Statistics:');
  console.log(`  Total Work Hours: ${summary._sum.totalHours?.toFixed(2) || 0}`);
  console.log(`  Total Break Hours: ${summary._sum.breakDuration?.toFixed(2) || 0}`);
  console.log(`  Total Idle Hours: ${summary._sum.idleTime?.toFixed(2) || 0}`);
  console.log(`  Avg Work Hours: ${summary._avg.totalHours?.toFixed(2) || 0}`);
  console.log(`  Avg Break Hours: ${summary._avg.breakDuration?.toFixed(2) || 0}`);
  console.log(`  Avg Idle Hours: ${summary._avg.idleTime?.toFixed(2) || 0}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
