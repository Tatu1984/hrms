import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Bundles everything the employee dashboard page needs into one round-trip.
// Mirrors the queries that used to live inline in
// src/app/(employee)/employee/dashboard/page.tsx.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE' || !session.employeeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const employeeId = session.employeeId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [employee, ceo, tasks, leaves, unreadMessageCount, activeAttendance, recentAttendance] =
    await Promise.all([
      prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          reportingHead: {
            select: { id: true, name: true, designation: true },
          },
        },
      }),
      prisma.employee.findFirst({
        where: {
          designation: { contains: 'CEO', mode: 'insensitive' },
          reportingHeadId: null,
        },
        select: { id: true, name: true, designation: true },
      }),
      prisma.task.findMany({ where: { assignedTo: employeeId } }),
      prisma.leave.findMany({ where: { employeeId } }),
      prisma.message.count({ where: { recipientId: employeeId, read: false } }),
      prisma.attendance.findFirst({
        where: { employeeId, date: { gte: today, lt: tomorrow } },
      }),
      prisma.attendance.findMany({
        where: { employeeId, date: { gte: thirtyDaysAgo } },
        select: { status: true },
      }),
    ]);

  const presentDays = recentAttendance.filter(
    (a) =>
      a.status === 'PRESENT' ||
      a.status === 'WEEKEND' ||
      a.status === 'HOLIDAY' ||
      a.status === 'LEAVE',
  ).length;
  const attendancePercentage =
    recentAttendance.length > 0
      ? ((presentDays / recentAttendance.length) * 100).toFixed(1)
      : '0.0';

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED').length;
  const leavesLeft = 24 - approvedLeaves;

  return NextResponse.json({
    employee,
    ceo,
    activeAttendance,
    stats: {
      attendancePercentage,
      leavesLeft,
      activeTasks,
      unreadMessages: unreadMessageCount,
    },
  });
}
