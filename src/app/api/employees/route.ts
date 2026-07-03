import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { orgWhere } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await prisma.employee.findMany({
      where: { ...orgWhere(session) },
      include: {
        reportingHead: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if email already exists (within the caller's org)
    const existing = await prisma.employee.findFirst({
      where: { email: body.email, ...orgWhere(session) },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Generate employee ID — scoped to the caller's org so each tenant has its
    // own EMP### sequence (employeeId is unique per org, not globally).
    const lastEmployee = await prisma.employee.findFirst({
      where: { ...orgWhere(session) },
      orderBy: { employeeId: 'desc' },
    });

    let empId: string;
    if (lastEmployee && lastEmployee.employeeId.startsWith('EMP')) {
      const lastNum = parseInt(lastEmployee.employeeId.replace('EMP', ''));
      empId = `EMP${String(lastNum + 1).padStart(3, '0')}`;
    } else {
      empId = 'EMP001';
    }

    // Create employee
    const newEmployee = await prisma.employee.create({
      data: {
        employeeId: empId,
        organizationId: session?.organizationId ?? null,
        name: body.name,
        email: body.email,
        phone: body.phone,
        altPhone: body.altPhone,
        altEmail: body.altEmail,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
        emergencyContactRelation: body.emergencyContactRelation,
        address: body.address,
        designation: body.designation,
        salaryType: body.salaryType || 'FIXED',
        salary: parseFloat(body.salary),
        variablePay: body.variablePay ? parseFloat(body.variablePay) : undefined,
        department: body.department,
        reportingHeadId: body.reportingHeadId || undefined,
        dateOfJoining: new Date(body.dateOfJoining),
        profilePicture: body.profilePicture,
        documents: body.documents || undefined,
      },
      include: {
        reportingHead: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    // Create user account with a RANDOM one-time password (no more universally
    // known "12345678"). The plaintext is returned once below so the admin can
    // share it with the new hire; it is never stored in plaintext.
    const tempPassword = 'Hr' + randomBytes(4).toString('hex').toUpperCase() + '!';
    const hashedPwd = await hashPassword(tempPassword);
    await prisma.user.create({
      data: {
        email: body.email,
        username: body.email.split('@')[0],
        password: hashedPwd,
        role: 'EMPLOYEE',
        employeeId: newEmployee.id,
        // Inherit the creating admin's org so the login identity is tenant-scoped
        // (previously omitted, which left new hires org-less and fail-open).
        organizationId: session?.organizationId ?? null,
      },
    });

    // tempPassword is surfaced ONCE to the admin UI; share it out-of-band.
    return NextResponse.json({ ...newEmployee, tempPassword }, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}