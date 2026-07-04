import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orgWhere } from "@/lib/tenant";
import type { JWTPayload } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!reportType) {
      return NextResponse.json(
        { error: "Report type is required" },
        { status: 400 }
      );
    }

    switch (reportType) {
      case "trial-balance":
        return await getTrialBalance(session);
      case "profit-loss":
        return await getProfitLoss(session, startDate, endDate);
      case "balance-sheet":
        return await getBalanceSheet(session);
      case "ledger-summary":
        return await getLedgerSummary(session);
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function getTrialBalance(session: JWTPayload) {
  const ledgers = await prisma.ledger.findMany({
    where: { isActive: true, ...orgWhere(session) },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          nature: true,
        },
      },
    },
    orderBy: [
      { group: { nature: "asc" } },
      { name: "asc" },
    ],
  });

  let totalDebit = 0;
  let totalCredit = 0;

  const data = ledgers.map((ledger) => {
    const balance = Number(ledger.currentBalance);
    const isDebitNature = ["ASSETS", "EXPENSES"].includes(ledger.group.nature);

    let debit = 0;
    let credit = 0;

    if (balance >= 0) {
      if (isDebitNature) {
        debit = balance;
      } else {
        credit = balance;
      }
    } else {
      if (isDebitNature) {
        credit = Math.abs(balance);
      } else {
        debit = Math.abs(balance);
      }
    }

    totalDebit += debit;
    totalCredit += credit;

    return {
      id: ledger.id,
      name: ledger.name,
      group: ledger.group.name,
      nature: ledger.group.nature,
      debit,
      credit,
    };
  });

  return NextResponse.json({
    type: "trial-balance",
    data,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
      difference: totalDebit - totalCredit,
    },
  });
}

async function getProfitLoss(session: JWTPayload, startDate: string | null, endDate: string | null) {
  // The P&L must reflect activity within the requested period, NOT the lifetime
  // ledger `currentBalance`. We therefore aggregate posted VoucherEntry
  // debit/credit amounts for INCOME/EXPENSES ledgers over the date range.
  const voucherFilter: Prisma.VoucherWhereInput = { isPosted: true, ...orgWhere(session) };

  if (startDate && endDate) {
    voucherFilter.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Income & expense ledgers (used to resolve names/nature after aggregation).
  const ledgers = await prisma.ledger.findMany({
    where: {
      isActive: true,
      ...orgWhere(session),
      group: { nature: { in: ["INCOME", "EXPENSES"] } },
    },
    select: {
      id: true,
      name: true,
      group: { select: { nature: true } },
    },
  });

  const ledgerMap = new Map(ledgers.map((l) => [l.id, l]));

  // Sum debit/credit per ledger from posted vouchers within the period.
  const grouped = await prisma.voucherEntry.groupBy({
    by: ["ledgerId"],
    where: {
      ...orgWhere(session),
      ledgerId: { in: ledgers.map((l) => l.id) },
      voucher: voucherFilter,
    },
    _sum: {
      debitAmount: true,
      creditAmount: true,
    },
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  const income: Array<{ name: string; amount: number }> = [];
  const expenses: Array<{ name: string; amount: number }> = [];

  grouped.forEach((entry) => {
    const ledger = ledgerMap.get(entry.ledgerId);
    if (!ledger) return;

    const debit = Number(entry._sum.debitAmount ?? 0);
    const credit = Number(entry._sum.creditAmount ?? 0);

    if (ledger.group.nature === "INCOME") {
      // Income is credit-nature: period income = credit - debit.
      const amount = credit - debit;
      totalIncome += amount;
      income.push({ name: ledger.name, amount });
    } else {
      // Expenses are debit-nature: period expense = debit - credit.
      const amount = debit - credit;
      totalExpenses += amount;
      expenses.push({ name: ledger.name, amount });
    }
  });

  return NextResponse.json({
    type: "profit-loss",
    period: startDate && endDate ? { startDate, endDate } : null,
    income,
    expenses,
    totals: {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    },
  });
}

async function getBalanceSheet(session: JWTPayload) {
  const ledgerGroups = await prisma.ledgerGroup.findMany({
    where: {
      ...orgWhere(session),
      nature: { in: ["ASSETS", "LIABILITIES", "EQUITY"] },
    },
    include: {
      ledgers: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          currentBalance: true,
        },
      },
    },
  });

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  const assets: Array<{ name: string; amount: number }> = [];
  const liabilities: Array<{ name: string; amount: number }> = [];
  const equity: Array<{ name: string; amount: number }> = [];

  ledgerGroups.forEach((group) => {
    group.ledgers.forEach((ledger) => {
      const amount = Number(ledger.currentBalance);
      if (group.nature === "ASSETS") {
        totalAssets += amount;
        assets.push({ name: ledger.name, amount });
      } else if (group.nature === "LIABILITIES") {
        totalLiabilities += amount;
        liabilities.push({ name: ledger.name, amount });
      } else {
        totalEquity += amount;
        equity.push({ name: ledger.name, amount });
      }
    });
  });

  // Retained earnings / current-period profit: net income (income - expenses)
  // is not otherwise closed into an equity ledger, so the accounting equation
  // (Assets = Liabilities + Equity) would not balance without it. We derive it
  // from the lifetime balances of income/expense ledgers and surface it as an
  // equity line.
  const pnlLedgers = await prisma.ledger.findMany({
    where: {
      isActive: true,
      ...orgWhere(session),
      group: { nature: { in: ["INCOME", "EXPENSES"] } },
    },
    select: {
      currentBalance: true,
      group: { select: { nature: true } },
    },
  });

  let retainedEarnings = 0;
  pnlLedgers.forEach((ledger) => {
    const balance = Number(ledger.currentBalance);
    retainedEarnings +=
      ledger.group.nature === "INCOME" ? balance : -balance;
  });

  if (retainedEarnings !== 0) {
    equity.push({
      name: "Retained Earnings (Current Period Profit)",
      amount: retainedEarnings,
    });
    totalEquity += retainedEarnings;
  }

  return NextResponse.json({
    type: "balance-sheet",
    assets,
    liabilities,
    equity,
    totals: {
      totalAssets,
      totalLiabilities,
      totalEquity,
      liabilitiesAndEquity: totalLiabilities + totalEquity,
    },
  });
}

async function getLedgerSummary(session: JWTPayload) {
  const summary = await prisma.ledgerGroup.findMany({
    where: { ...orgWhere(session) },
    include: {
      _count: {
        select: { ledgers: true },
      },
      ledgers: {
        where: { isActive: true },
        select: {
          currentBalance: true,
        },
      },
    },
  });

  const data = summary.map((group) => ({
    id: group.id,
    name: group.name,
    nature: group.nature,
    ledgerCount: group._count.ledgers,
    totalBalance: group.ledgers.reduce(
      (sum, l) => sum + Number(l.currentBalance),
      0
    ),
  }));

  return NextResponse.json({
    type: "ledger-summary",
    data,
  });
}
