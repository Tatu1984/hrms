import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/payroll - Get payroll records
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const employeeId = searchParams.get('employeeId');

    const where: any = {};

    // Role-based filtering
    if (session.role === 'EMPLOYEE') {
      where.employeeId = session.employeeId;
    } else if (session.role === 'MANAGER') {
      // Managers see their own + team payroll
      const teamMembers = await prisma.employee.findMany({
        where: { reportingHeadId: session.employeeId },
      });
      const teamIds = [session.employeeId!, ...teamMembers.map(t => t.id)];
      where.employeeId = { in: teamIds };
    }

    if (month) {
      where.month = parseInt(month);
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (employeeId && session.role === 'ADMIN') {
      where.employeeId = employeeId;
    }

    const payroll = await prisma.payroll.findMany({
      where,
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
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    return NextResponse.json(payroll);
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 });
  }
}

// POST /api/payroll - Generate payroll
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { month, year, employeeIds } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year required' }, { status: 400 });
    }

    // Get employees to process
    const where: any = {};
    if (employeeIds && employeeIds.length > 0) {
      where.id = { in: employeeIds };
    }

    const employees = await prisma.employee.findMany({ where });

    const payrollRecords = [];

    for (const emp of employees) {
      // Check if payroll already exists
      const existing = await prisma.payroll.findFirst({
        where: {
          employeeId: emp.id,
          month: parseInt(month),
          year: parseInt(year),
        },
      });

      if (existing) {
        continue; // Skip if already exists
      }

      // Get attendance for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendance = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
      const halfDays = attendance.filter(a => a.status === 'HALF_DAY').length;

      // Count weekends in the month (Saturdays and Sundays)
      let weekendDays = 0;
      for (let day = 1; day <= endDate.getDate(); day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
          weekendDays++;
        }
      }

      // Total working days excludes weekends (weekends are holidays, not counted in salary calculation)
      const totalDaysInMonth = endDate.getDate();
      const totalWorkingDays = totalDaysInMonth - weekendDays;
      const effectiveDays = presentDays + (halfDays * 0.5);
      const absentDays = totalWorkingDays - effectiveDays;

      // Salary components from employee record - department specific
      // Only Sales department gets 70% basic + 30% variable structure
      const isSales = emp.department === 'Sales' || emp.employeeType === 'Sales';
      const basicSalary = emp.basicSalary || (isSales ? emp.salary * 0.7 : emp.salary);
      const variablePay = emp.variablePay || (isSales ? emp.salary * 0.3 : 0);
      const salesTarget = emp.salesTarget || 0;

      // Calculate Basic Payable (attendance-based)
      const perDayBasic = basicSalary / totalWorkingDays;
      const basicPayable = perDayBasic * effectiveDays;

      // Calculate Variable Payable (target achievement-based)
      // For now, if employee has target, calculate based on % achievement
      // This can be enhanced with actual sales data
      const targetAchieved = 0; // Will be input by admin or fetched from sales
      const targetAchievementPercent = salesTarget > 0 ? (targetAchieved / salesTarget) * 100 : 0;
      const variablePayable = isSales ? (variablePay * targetAchievementPercent) / 100 : 0;

      // Gross Salary
      const grossSalary = basicPayable + variablePayable;

      // Deductions
      const professionalTax = 200; // Fixed P.tax
      const tds = grossSalary * 0.1; // 10% TDS
      const penalties = 0; // Will be input by admin
      const advancePayment = 0; // Will be input by admin
      const otherDeductions = 0;

      const totalDeductions = professionalTax + tds + penalties + advancePayment + otherDeductions;

      // Net Salary
      const netSalary = grossSalary - totalDeductions;

      const payrollRecord = await prisma.payroll.create({
        data: {
          employeeId: emp.id,
          month: parseInt(month),
          year: parseInt(year),
          workingDays: totalWorkingDays,
          daysPresent: presentDays,
          daysAbsent: absentDays,

          basicSalary,
          variablePay,
          salesTarget,
          targetAchieved,

          basicPayable,
          variablePayable,
          grossSalary,

          professionalTax,
          tds,
          penalties,
          advancePayment,
          otherDeductions,
          totalDeductions,

          netSalary,
          status: 'PENDING',
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              name: true,
              designation: true,
              department: true,
              employeeType: true,
            },
          },
        },
      });

      payrollRecords.push(payrollRecord);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${payrollRecords.length} payroll records`,
      payroll: payrollRecords,
    }, { status: 201 });
  } catch (error) {
    console.error('Generate payroll error:', error);
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 });
  }
}

// PUT /api/payroll - Update payroll status
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    const payroll = await prisma.payroll.update({
      where: { id },
      data: { status },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, payroll });
  } catch (error) {
    console.error('Update payroll error:', error);
    return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 });
  }
}

// DELETE /api/payroll - Delete payroll record
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Payroll ID required' }, { status: 400 });
    }

    await prisma.payroll.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete payroll error:', error);
    return NextResponse.json({ error: 'Failed to delete payroll' }, { status: 500 });
  }
}
