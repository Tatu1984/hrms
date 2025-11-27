import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Only admins can view suspicious activity
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');

    // Build query for suspicious activity logs
    const where: any = {
      suspicious: true, // Only get suspicious activity
    };

    // Date range filter
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.timestamp = {
        gte: thirtyDaysAgo,
      };
    }

    // Employee filter
    if (employeeId) {
      where.attendance = {
        employeeId,
      };
    }

    // Fetch suspicious activity logs
    const suspiciousLogs = await prisma.activityLog.findMany({
      where,
      include: {
        attendance: {
          include: {
            employee: {
              select: {
                id: true,
                employeeId: true,
                name: true,
                designation: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 500, // Limit to 500 most recent
    });

    // Group by employee and date for summary
    const summaryMap = new Map<string, {
      employee: any;
      date: string;
      count: number;
      timestamps: Date[];
    }>();

    suspiciousLogs.forEach(log => {
      const key = `${log.attendance.employeeId}_${new Date(log.attendance.date).toISOString().split('T')[0]}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          employee: log.attendance.employee,
          date: new Date(log.attendance.date).toISOString().split('T')[0],
          count: 0,
          timestamps: [],
        });
      }

      const summary = summaryMap.get(key)!;
      summary.count++;
      summary.timestamps.push(new Date(log.timestamp));
    });

    // Convert to array and sort by count (most suspicious first)
    const summary = Array.from(summaryMap.values())
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalSuspicious: suspiciousLogs.length,
      summary,
      logs: suspiciousLogs,
    });
  } catch (error) {
    console.error('Error fetching suspicious activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suspicious activity' },
      { status: 500 }
    );
  }
}
