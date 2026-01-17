import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
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
        return await getTrialBalance();
      case "profit-loss":
        return await getProfitLoss(startDate, endDate);
      case "balance-sheet":
        return await getBalanceSheet();
      case "ledger-summary":
        return await getLedgerSummary();
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

async function getTrialBalance() {
  const ledgers = await prisma.ledger.findMany({
    where: { isActive: true },
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

async function getProfitLoss(startDate: string | null, endDate: string | null) {
  const dateFilter: Record<string, unknown> = {};

  if (startDate && endDate) {
    dateFilter.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Get income and expense ledgers
  const ledgerGroups = await prisma.ledgerGroup.findMany({
    where: {
      nature: { in: ["INCOME", "EXPENSES"] },
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

  let totalIncome = 0;
  let totalExpenses = 0;

  const income: Array<{ name: string; amount: number }> = [];
  const expenses: Array<{ name: string; amount: number }> = [];

  ledgerGroups.forEach((group) => {
    group.ledgers.forEach((ledger) => {
      const amount = Number(ledger.currentBalance);
      if (group.nature === "INCOME") {
        totalIncome += amount;
        income.push({ name: ledger.name, amount });
      } else {
        totalExpenses += amount;
        expenses.push({ name: ledger.name, amount });
      }
    });
  });

  return NextResponse.json({
    type: "profit-loss",
    income,
    expenses,
    totals: {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    },
  });
}

async function getBalanceSheet() {
  const ledgerGroups = await prisma.ledgerGroup.findMany({
    where: {
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

async function getLedgerSummary() {
  const summary = await prisma.ledgerGroup.findMany({
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
