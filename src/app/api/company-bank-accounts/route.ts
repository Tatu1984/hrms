import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { orgWhere, withOrg } from '@/lib/tenant';

// GET - Fetch all bank accounts for a company
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN');
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    const accounts = await prisma.companyBankAccount.findMany({
      where: { companyId, ...orgWhere(auth) },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  }
}

// POST - Create new bank account
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN');
    if (auth instanceof NextResponse) return auth;

    const data = await request.json();
    const { companyId, ...accountData } = data;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // If this account is set as default, unset other defaults
    if (accountData.isDefault) {
      await prisma.companyBankAccount.updateMany({
        where: { companyId, isDefault: true, ...orgWhere(auth) },
        data: { isDefault: false },
      });
    }

    const account = await prisma.companyBankAccount.create({
      data: withOrg(auth, {
        companyId,
        ...accountData,
      }),
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
  }
}

// PUT - Update bank account
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN');
    if (auth instanceof NextResponse) return auth;

    const data = await request.json();
    const { id, companyId, ...accountData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    // If this account is set as default, unset other defaults
    if (accountData.isDefault) {
      await prisma.companyBankAccount.updateMany({
        where: { companyId, isDefault: true, NOT: { id }, ...orgWhere(auth) },
        data: { isDefault: false },
      });
    }

    const existing = await prisma.companyBankAccount.findFirst({
      where: { id, ...orgWhere(auth) },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const account = await prisma.companyBankAccount.update({
      where: { id },
      data: accountData,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
  }
}

// DELETE - Delete bank account
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN');
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const existing = await prisma.companyBankAccount.findFirst({
      where: { id, ...orgWhere(auth) },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    await prisma.companyBankAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
  }
}
