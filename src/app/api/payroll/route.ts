import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere, withOrg } from '@/lib/tenant';
import { computeStatutoryDeductions, computeAbsentDays, type DeductionToggles } from '@/lib/payroll-calc';

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

    const where: any = { ...orgWhere(session) };

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
  // Per-employee payroll math is verbose; keep it out of prod logs unless
  // PAYROLL_DEBUG is explicitly enabled. Errors still use console.error.
  const dbg = process.env.PAYROLL_DEBUG === 'true' ? console.log : () => {};
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year required' }, { status: 400 });
    }

    // Target employees: accept either `employeeIds` (array) or a single
    // `employeeId`. Empty/absent => every employee in the org.
    const targetIds: string[] = Array.isArray(body.employeeIds)
      ? body.employeeIds
      : body.employeeId
        ? [body.employeeId]
        : [];

    // When true, recompute and overwrite an existing (non-PAID) record instead
    // of skipping it. Lets admins regenerate after attendance edits.
    const overwrite: boolean = body.overwrite === true;

    // Get employees to process. Inactive (offboarded) employees never get
    // salary generated — they are excluded even when explicitly targeted.
    const where: any = { ...orgWhere(session), isActive: true };
    if (targetIds.length > 0) {
      where.id = { in: targetIds };
    }

    const employees = await prisma.employee.findMany({ where });

    // If specific employees were requested, surface how many were dropped for
    // being inactive so the outcome is never silently smaller than requested.
    let skippedInactive = 0;
    if (targetIds.length > 0) {
      skippedInactive = targetIds.length - employees.length;
    }

    // Deduction config + optional per-run toggle overrides (admin's choice).
    // Scope to the caller's org so each tenant uses its own PF/ESI/TDS/PT rates.
    const salaryConfig = await prisma.salaryConfig.findFirst({ where: { ...orgWhere(session) } });
    const deductionOverrides: DeductionToggles | undefined = body.applyDeductions;

    const payrollRecords = [];
    let skipped = 0; // already existed, overwrite not requested
    let skippedPaid = 0; // already existed and already PAID — never touched
    let overwritten = 0; // existing non-PAID record recomputed

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
        // A finalized (PAID) payroll is immutable — never regenerate it.
        if (existing.status === 'PAID') {
          skippedPaid++;
          continue;
        }
        // Existing but not overwriting => leave it as-is.
        if (!overwrite) {
          skipped++;
          continue;
        }
        // else: fall through and recompute, updating the existing row below.
      }

      // AUTHORITATIVE PAYROLL LOGIC
      dbg(`\n=== Payroll Calculation for ${emp.name} (${emp.employeeId}) ===`);
      dbg(`Month: ${month}, Year: ${year}`);

      // Calculate calculation_date (today or last day of month if past)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const monthStartDate = new Date(year, month - 1, 1);
      monthStartDate.setHours(0, 0, 0, 0);

      const monthEndDate = new Date(year, month, 0);
      monthEndDate.setHours(0, 0, 0, 0);

      // calculation_date is min(today, month_end)
      let calculationDate = new Date(today);
      if (today > monthEndDate) {
        calculationDate = new Date(monthEndDate);
      }
      calculationDate.setHours(0, 0, 0, 0);

      dbg(`Month start: ${monthStartDate.toISOString().split('T')[0]}`);
      dbg(`Month end: ${monthEndDate.toISOString().split('T')[0]}`);
      dbg(`Calculation date: ${calculationDate.toISOString().split('T')[0]}`);

      // Get employee join and leave dates
      const joinDate = new Date(emp.dateOfJoining);
      joinDate.setHours(0, 0, 0, 0);

      // Note: Employee model doesn't have leaveDate yet, so we'll use null for now
      const leaveDate = null as Date | null; // emp.leaveDate ? new Date(emp.leaveDate) : null;

      dbg(`Join date: ${joinDate.toISOString().split('T')[0]}`);
      dbg(`Leave date: ${leaveDate ? leaveDate.toISOString().split('T')[0] : 'N/A'}`);

      // Determine effective attendance window
      // effective_start = max(join_date, month_start_date)
      const effectiveStart = joinDate > monthStartDate ? new Date(joinDate) : new Date(monthStartDate);
      effectiveStart.setHours(0, 0, 0, 0);

      // effective_end = min(calculation_date, leave_date if provided else calculation_date)
      let effectiveEnd = new Date(calculationDate);
      if (leaveDate && leaveDate < calculationDate) {
        effectiveEnd = new Date(leaveDate);
      }
      effectiveEnd.setHours(0, 0, 0, 0);

      dbg(`Effective start: ${effectiveStart.toISOString().split('T')[0]}`);
      dbg(`Effective end: ${effectiveEnd.toISOString().split('T')[0]}`);

      // Get attendance records. Fetch a few days either side of the month so the
      // weekend cascade can see the adjacent weekday when a Sat/Sun falls on the
      // month boundary (e.g. the 1st is a Saturday whose Friday is last month).
      const attnStart = new Date(monthStartDate);
      attnStart.setDate(attnStart.getDate() - 3);
      const attnEnd = new Date(monthEndDate);
      attnEnd.setDate(attnEnd.getDate() + 3);
      const attendance = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: {
            gte: attnStart,
            lte: attnEnd,
          },
          ...orgWhere(session),
        },
        orderBy: { date: 'asc' },
      });

      dbg(`Total attendance records found: ${attendance.length}`);

      // Absent-day payroll model (the manual Excel method): the full monthly
      // salary is divided by a FIXED 30 and one day's pay is docked for each
      // ABSENT day. Present days, approved paid leave, holidays, and "off"
      // weekends are not deducted. Weekend cascade (Sat docked iff Fri absent;
      // Sun docked iff Mon absent) and join/leave handling live in the
      // unit-tested computeAbsentDays helper.
      const absentDays =
        effectiveEnd < effectiveStart
          ? 30 // employed for none of the period -> full deduction (no pay)
          : computeAbsentDays({
              monthStart: monthStartDate,
              through: effectiveEnd,
              joinDate,
              leaveDate,
              attendance,
            });

      // Days actually paid out of the 30-day basis (never negative or above 30).
      const payableDays = Math.max(0, 30 - absentDays);

      dbg(`Absent days: ${absentDays}, Payable days (of 30): ${payableDays}`);

      // Salary calculation based on salaryType
      const isVariable = emp.salaryType === 'VARIABLE';
      const monthlySalary = emp.salary;

      let totalPaid = 0;
      let fixedPaid = 0;
      let variablePaid = 0;
      let basicSalary = 0;
      let variablePay = 0;
      let salesTargetUSD = 0;
      let achievedUpfront = 0;

      if (isVariable) {
        // Variable salary employee
        const fixedPart = monthlySalary * 0.70;
        const variablePart = monthlySalary * 0.30;

        basicSalary = fixedPart;
        variablePay = variablePart;

        // Calculate fixed paid based on attendance (fixed 30-day-month divisor).
        fixedPaid = (fixedPart / 30) * payableDays;

        // Calculate gross target and required upfront
        const grossTarget = monthlySalary / 10;
        const requiredUpfront = 0.30 * grossTarget;

        salesTargetUSD = grossTarget;

        // Get actual achieved upfront from sales data
        const salesData = await prisma.sale.findMany({
          where: {
            closedBy: emp.id,
            month: parseInt(month),
            year: parseInt(year),
            status: { in: ['CONFIRMED', 'DELIVERED', 'PAID'] },
          },
        });

        achievedUpfront = salesData.reduce((sum, sale) => sum + sale.netAmount, 0);

        // Calculate variable ratio
        let variableRatio = 0;
        if (requiredUpfront > 0) {
          variableRatio = Math.min(1.0, achievedUpfront / requiredUpfront);
        }

        variablePaid = variablePart * variableRatio;

        totalPaid = fixedPaid + variablePaid;

        dbg(`Variable salary calculation:`, {
          monthlySalary,
          fixedPart,
          variablePart,
          absentDays,
          payableDays,
          fixedPaid: fixedPaid.toFixed(2),
          grossTarget,
          requiredUpfront,
          achievedUpfront,
          variableRatio: variableRatio.toFixed(2),
          variablePaid: variablePaid.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
        });
      } else {
        // Fixed salary employee: salary/30 per day, paid for the payable days
        // (30 minus absent days).
        const perDayRate = monthlySalary / 30;
        totalPaid = perDayRate * payableDays;

        basicSalary = monthlySalary;
        variablePay = 0;
        fixedPaid = totalPaid;
        variablePaid = 0;

        dbg(`Fixed salary calculation:`, {
          monthlySalary,
          perDayRate,
          absentDays,
          payableDays,
          totalPaid: totalPaid.toFixed(2),
        });
      }

      // Round to 2 decimal places
      const basicPayable = Math.round(fixedPaid * 100) / 100;
      const variablePayable = Math.round(variablePaid * 100) / 100;
      const grossSalary = Math.round(totalPaid * 100) / 100;

      // Statutory deductions from SalaryConfig, each toggleable (admin's choice).
      const statutory = computeStatutoryDeductions(
        { basicPayable, grossSalary },
        salaryConfig,
        deductionOverrides,
      );
      const pf = statutory.pf;
      const esi = statutory.esi;
      const professionalTax = statutory.professionalTax;
      const tds = statutory.tds;
      // Manual, admin-entered deductions (set post-generation via PUT). On a
      // fresh record these start at 0; on an overwrite we PRESERVE whatever the
      // admin already keyed in so regenerating attendance never wipes them.
      const penalties = existing ? existing.penalties : 0;
      const advancePayment = existing ? existing.advancePayment : 0;
      const otherDeductions = existing ? existing.otherDeductions : 0;

      const totalDeductions =
        pf + esi + professionalTax + tds + penalties + advancePayment + otherDeductions;

      // Net Salary — floored at 0 so statutory deductions on a low/zero-earning
      // month can never produce negative take-home.
      const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

      dbg(`Gross salary: ${grossSalary}`);
      dbg(`Total deductions: ${totalDeductions}`);
      dbg(`Net salary: ${netSalary}\n`);

      // Stored for display against the fixed 30-day basis:
      // workingDays = 30, daysPresent = payable (30 - absent), daysAbsent = absent.
      // All attendance-derived fields; preserve the existing status on overwrite.
      const computed = {
        workingDays: 30,
        daysPresent: Math.round(payableDays * 10) / 10,
        daysAbsent: Math.round(absentDays * 10) / 10,

        basicSalary,
        variablePay,
        salesTarget: salesTargetUSD,
        targetAchieved: achievedUpfront,

        basicPayable,
        variablePayable,
        grossSalary,

        pf,
        esi,
        professionalTax,
        tds,
        penalties,
        advancePayment,
        otherDeductions,
        totalDeductions,

        netSalary,
      };

      const includeEmployee = {
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
      };

      let payrollRecord;
      if (existing) {
        // Overwrite path: recompute in place, keep the row's current status.
        payrollRecord = await prisma.payroll.update({
          where: { id: existing.id },
          data: computed,
          include: includeEmployee,
        });
        overwritten++;
        dbg(`✓ Payroll record recomputed for ${emp.name}`);
      } else {
        payrollRecord = await prisma.payroll.create({
          data: withOrg(session, {
            employeeId: emp.id,
            month: parseInt(month),
            year: parseInt(year),
            ...computed,
            status: 'PENDING',
          }),
          include: includeEmployee,
        });
        dbg(`✓ Payroll record created for ${emp.name}`);
      }
      payrollRecords.push(payrollRecord);
    }

    dbg(`\n=== PAYROLL GENERATION COMPLETE ===`);
    dbg(`Records written: ${payrollRecords.length} (overwritten: ${overwritten})`);

    // Build a precise, human-readable summary so a "nothing happened" outcome
    // (everything already existed) is never silent.
    const created = payrollRecords.length - overwritten;
    const parts: string[] = [];
    if (created) parts.push(`generated ${created}`);
    if (overwritten) parts.push(`regenerated ${overwritten}`);
    if (skipped) parts.push(`skipped ${skipped} already-generated`);
    if (skippedPaid) parts.push(`skipped ${skippedPaid} already-paid`);
    if (skippedInactive) parts.push(`skipped ${skippedInactive} inactive`);
    const message =
      parts.length > 0
        ? `Payroll: ${parts.join(', ')}.`
        : 'No active employees matched — nothing to generate.';

    return NextResponse.json({
      success: true,
      message,
      counts: { created, overwritten, skipped, skippedPaid, skippedInactive },
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
    const { id, status, penalties, advancePayment, otherDeductions } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const existing = await prisma.payroll.findFirst({ where: { id, ...orgWhere(session) } });
    if (!existing) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;

    // Allow admin to enter manual deductions; recompute totals + net when any change.
    const editsDeductions =
      penalties !== undefined || advancePayment !== undefined || otherDeductions !== undefined;
    if (editsDeductions) {
      const newPenalties = penalties !== undefined ? Number(penalties) : existing.penalties;
      const newAdvance = advancePayment !== undefined ? Number(advancePayment) : existing.advancePayment;
      const newOther = otherDeductions !== undefined ? Number(otherDeductions) : existing.otherDeductions;
      const totalDeductions =
        existing.pf + existing.esi + existing.professionalTax + existing.tds +
        newPenalties + newAdvance + newOther;
      data.penalties = newPenalties;
      data.advancePayment = newAdvance;
      data.otherDeductions = newOther;
      data.totalDeductions = Math.round(totalDeductions * 100) / 100;
      data.netSalary = Math.round((existing.grossSalary - totalDeductions) * 100) / 100;
    }

    const payroll = await prisma.payroll.update({
      where: { id },
      data,
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

    // Ensure the payroll record belongs to the caller's org before deleting.
    const existing = await prisma.payroll.findFirst({
      where: { id, ...orgWhere(session) },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
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
