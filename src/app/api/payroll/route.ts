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

      // Salary components based on designation
      // Sales designations: CSR, Sr CSR, Supervisor get 70% basic + 30% variable
      const salesDesignations = ['CSR', 'Sr CSR', 'Supervisor'];
      const isSales = salesDesignations.includes(emp.designation);

      const basicSalary = emp.basicSalary || (isSales ? emp.salary * 0.7 : emp.salary);
      const variablePay = emp.variablePay || (isSales ? emp.salary * 0.3 : 0);

      // Calculate USD target: Gross Salary / 10
      const salesTargetUSD = isSales ? emp.salary / 10 : 0;

      // Calculate Basic Payable (attendance-based)
      const perDayBasic = basicSalary / totalWorkingDays;
      const basicPayable = perDayBasic * effectiveDays;

      // Calculate Variable Payable (target achievement-based for sales)
      let variablePayable = 0;
      if (isSales && salesTargetUSD > 0) {
        // Get sales data for this employee for the month
        const salesData = await prisma.sale.findMany({
          where: {
            closedBy: emp.id,
            month: parseInt(month),
            year: parseInt(year),
            status: { in: ['CONFIRMED', 'DELIVERED', 'PAID'] },
          },
        });

        // Calculate total gross and net achieved
        const totalGrossAchieved = salesData.reduce((sum, sale) => sum + sale.grossAmount, 0);
        const totalNetAchieved = salesData.reduce((sum, sale) => sum + sale.netAmount, 0);

        // Achievement Calculation:
        // 1. Gross Achievement % = (Total Gross Achieved / Target) * 100
        const grossAchievementPercent = (totalGrossAchieved / salesTargetUSD) * 100;

        // 2. Net Achievement % = (Total Net Achieved / (Target * 0.25)) * 100
        //    Based on 25% minimum upfront payment mandate
        const expectedMinimumUpfront = salesTargetUSD * 0.25;
        const netAchievementPercent = (totalNetAchieved / expectedMinimumUpfront) * 100;

        // 3. Average Achievement = (Gross Achievement % + Net Achievement %) / 2
        const averageAchievementPercent = (grossAchievementPercent + netAchievementPercent) / 2;

        // 4. Variable Payable = 30% of salary * (Average Achievement % / 100)
        variablePayable = variablePay * (averageAchievementPercent / 100);

        console.log(`Sales calculation for ${emp.name}:`, {
          grossSalary: emp.salary,
          targetUSD: salesTargetUSD,
          totalGrossAchieved,
          totalNetAchieved,
          grossAchievementPercent: grossAchievementPercent.toFixed(2) + '%',
          expectedMinimumUpfront,
          netAchievementPercent: netAchievementPercent.toFixed(2) + '%',
          averageAchievementPercent: averageAchievementPercent.toFixed(2) + '%',
          variablePay,
          variablePayable: variablePayable.toFixed(2),
        });
      }

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
          salesTarget: salesTargetUSD,
          targetAchieved: isSales ? (await prisma.sale.aggregate({
            where: {
              closedBy: emp.id,
              month: parseInt(month),
              year: parseInt(year),
              status: { in: ['CONFIRMED', 'DELIVERED', 'PAID'] },
            },
            _sum: { netAmount: true },
          }))._sum.netAmount || 0 : 0,

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
