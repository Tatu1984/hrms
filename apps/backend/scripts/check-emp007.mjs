import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const employee = await prisma.employee.findFirst({
    where: { employeeId: 'EMP007' },
  });

  // Find record with ~343 minutes (5.72 hours) idle time
  const records = await prisma.attendance.findMany({
    where: { employeeId: employee.id },
    orderBy: { date: 'desc' },
    take: 10,
  });

  console.log('Recent attendance records for EMP007:');
  for (const r of records) {
    const idleMin = Math.round((r.idleTime || 0) * 60);
    console.log(`  ${r.date.toISOString().split('T')[0]}: ${idleMin} min idle (${r.idleTime?.toFixed(2) || 0} hrs)`);
  }

  // Look for 343 specifically
  const target = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      idleTime: { gte: 5.7, lte: 5.75 }, // ~343 minutes
    },
  });

  if (target) {
    console.log('\nFound 343min record:', target.date);
  } else {
    console.log('\nNo record with exactly 343 minutes found');
  }

  await prisma.$disconnect();
}

check();
