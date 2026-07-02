import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

/**
 * Self-serve tenant signup. Provisions a new Organization plus its first ADMIN
 * user (and a matching admin Employee record), then the user logs in normally.
 * Email/username are platform-global identities (one account = one org).
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const companyName = String(body.companyName || '').trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const username = String(body.username || email).trim().toLowerCase();
    const password = String(body.password || '');

    if (!companyName || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Company name, your name, email, and password are required' },
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
        { error: 'An account with this email or username already exists' },
        { status: 409 },
      );
    }

    // Ensure a unique org slug.
    const base = slugify(companyName);
    let slug = base;
    for (let i = 1; await prisma.organization.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }

    const hashed = await hashPassword(password);

    const org = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: companyName, slug },
      });
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
        },
      });
      return organization;
    });

    return NextResponse.json(
      { success: true, organization: { id: org.id, name: org.name, slug: org.slug } },
      { status: 201 },
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
