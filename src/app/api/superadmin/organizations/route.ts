import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/superadmin';

/**
 * Cross-org platform console (super-admin only). Lists every tenant with basic
 * counts, and provisions a new tenant (Organization + first ADMIN user).
 */

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'org'
  );
}

export async function GET() {
  const session = await getSession();
  if (!session || !(await isSuperAdmin(session))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      plan: true,
      subscriptionStatus: true,
      createdAt: true,
      _count: { select: { users: true, employees: true } },
    },
  });

  return NextResponse.json(organizations);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !(await isSuperAdmin(session))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const companyName = String(body.companyName || '').trim();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const username = String(body.username || email).trim().toLowerCase();
  const password = String(body.password || '');

  if (!companyName || !name || !email || !password) {
    return NextResponse.json(
      { error: 'Company name, admin name, email, and password are required' },
      { status: 400 },
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    return NextResponse.json(
      { error: 'A user with this email or username already exists' },
      { status: 409 },
    );
  }

  const base = slugify(companyName);
  let slug = base;
  for (let i = 1; await prisma.organization.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const hashed = await hashPassword(password);

  const org = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: companyName, slug } });
    const employee = await tx.employee.create({
      data: {
        organizationId: organization.id,
        employeeId: `ADM-${organization.id.slice(-6).toUpperCase()}`,
        name,
        email,
        phone: '',
        address: '',
        designation: 'Administrator',
        department: 'Management',
        salary: 0,
        dateOfJoining: new Date(),
      },
    });
    await tx.user.create({
      data: {
        username,
        email,
        password: hashed,
        role: 'ADMIN',
        employeeId: employee.id,
        organizationId: organization.id,
        // The tenant admin must set their own password on first login.
        mustChangePassword: true,
      },
    });
    return organization;
  });

  return NextResponse.json(
    { success: true, organization: { id: org.id, name: org.name, slug: org.slug } },
    { status: 201 },
  );
}
