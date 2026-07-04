import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere } from '@/lib/tenant';
import { createVoucherForAccountEntry } from '@/app/api/accounts/route';

/**
 * Backfill the double-entry ledgers from legacy Account (quick-entry) rows that
 * were never posted to a voucher (voucherId = null). Idempotent: an entry is
 * skipped once it has a linked voucher, so this is safe to run repeatedly.
 */

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
  }
  const unposted = await prisma.account.count({
    where: { voucherId: null, ...orgWhere(session) },
  });
  return NextResponse.json({ unposted });
}

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
  }

  const entries = await prisma.account.findMany({
    where: { voucherId: null, ...orgWhere(session) },
    include: { category: { select: { name: true } } },
    orderBy: { date: 'asc' },
  });

  let posted = 0;
  const failed: string[] = [];

  for (const entry of entries) {
    try {
      const voucher = await createVoucherForAccountEntry(
        session,
        entry.type as 'INCOME' | 'EXPENSE',
        entry.amount,
        new Date(entry.date),
        entry.description,
        entry.reference,
        entry.category?.name,
      );
      if (voucher?.id) {
        await prisma.account.update({ where: { id: entry.id }, data: { voucherId: voucher.id } });
        posted += 1;
      } else {
        failed.push(entry.id);
      }
    } catch (err) {
      console.error(`Failed to post account entry ${entry.id} to ledgers:`, err);
      failed.push(entry.id);
    }
  }

  return NextResponse.json({
    success: true,
    posted,
    failed: failed.length,
    remaining: entries.length - posted,
  });
}
