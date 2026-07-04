import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere } from '@/lib/tenant';

/**
 * Real accounting summary for the accounting hub (replaces the old hardcoded
 * mock numbers). Income/expense come from the Account table — the same source
 * the dashboard uses — scoped to the caller's org. Receivables come from unpaid
 * invoices. Values with no real data source are returned as 0 rather than faked.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [income, expense, invoices] = await Promise.all([
    prisma.account.aggregate({
      where: { type: 'INCOME', ...orgWhere(session) },
      _sum: { amount: true },
    }),
    prisma.account.aggregate({
      where: { type: 'EXPENSE', ...orgWhere(session) },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { ...orgWhere(session) },
      select: { amount: true, paidAmount: true, status: true },
    }),
  ]);

  const totalIncome = income._sum.amount || 0;
  const totalExpenses = expense._sum.amount || 0;
  const netProfit = totalIncome - totalExpenses;

  const unpaid = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
  const receivables = unpaid.reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0);

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netProfit,
    // Every Account entry is a cash receipt/payment, so net cash = net profit.
    cashBalance: netProfit,
    bankBalance: 0,
    receivables,
    payables: 0,
    pendingInvoices: unpaid.length,
    pendingBills: 0,
  });
}
