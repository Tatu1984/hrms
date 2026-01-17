import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/accounting/seed - Initialize accounting system with default data
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already seeded
    const existingGroups = await prisma.ledgerGroup.count();
    if (existingGroups > 0) {
      return NextResponse.json({
        message: "Accounting system already initialized",
        seeded: false,
      });
    }

    // Create default fiscal year (Indian FY: April to March)
    const now = new Date();
    const currentMonth = now.getMonth();
    const fyStartYear = currentMonth >= 3 ? now.getFullYear() : now.getFullYear() - 1;

    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        name: `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`,
        startDate: new Date(fyStartYear, 3, 1), // April 1
        endDate: new Date(fyStartYear + 1, 2, 31), // March 31
      },
    });

    // Create default ledger groups with standard chart of accounts
    const ledgerGroups = await Promise.all([
      // ASSETS
      prisma.ledgerGroup.create({
        data: { name: "Fixed Assets", nature: "ASSETS", isSystem: true, sequence: 1 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Current Assets", nature: "ASSETS", isSystem: true, sequence: 2 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Cash & Bank", nature: "ASSETS", isSystem: true, sequence: 3 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Sundry Debtors", nature: "ASSETS", isSystem: true, sequence: 4 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Loans & Advances", nature: "ASSETS", isSystem: true, sequence: 5 },
      }),
      // LIABILITIES
      prisma.ledgerGroup.create({
        data: { name: "Capital Account", nature: "LIABILITIES", isSystem: true, sequence: 6 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Current Liabilities", nature: "LIABILITIES", isSystem: true, sequence: 7 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Sundry Creditors", nature: "LIABILITIES", isSystem: true, sequence: 8 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Duties & Taxes", nature: "LIABILITIES", isSystem: true, sequence: 9 },
      }),
      // INCOME
      prisma.ledgerGroup.create({
        data: { name: "Sales Account", nature: "INCOME", isSystem: true, affectsGrossProfit: true, sequence: 10 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Direct Income", nature: "INCOME", isSystem: true, affectsGrossProfit: true, sequence: 11 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Indirect Income", nature: "INCOME", isSystem: true, sequence: 12 },
      }),
      // EXPENSES
      prisma.ledgerGroup.create({
        data: { name: "Purchase Account", nature: "EXPENSES", isSystem: true, affectsGrossProfit: true, sequence: 13 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Direct Expenses", nature: "EXPENSES", isSystem: true, affectsGrossProfit: true, sequence: 14 },
      }),
      prisma.ledgerGroup.create({
        data: { name: "Indirect Expenses", nature: "EXPENSES", isSystem: true, sequence: 15 },
      }),
      // EQUITY
      prisma.ledgerGroup.create({
        data: { name: "Reserves & Surplus", nature: "EQUITY", isSystem: true, sequence: 16 },
      }),
    ]);

    // Create default voucher types
    await Promise.all([
      prisma.voucherType.create({
        data: {
          name: "Payment",
          code: "PYMT",
          nature: "PAYMENT",
          numberingPrefix: "PYMT",
          autoNumbering: true,
        },
      }),
      prisma.voucherType.create({
        data: {
          name: "Receipt",
          code: "RCPT",
          nature: "RECEIPT",
          numberingPrefix: "RCPT",
          autoNumbering: true,
        },
      }),
      prisma.voucherType.create({
        data: {
          name: "Journal",
          code: "JV",
          nature: "JOURNAL",
          numberingPrefix: "JV",
          autoNumbering: true,
        },
      }),
      prisma.voucherType.create({
        data: {
          name: "Contra",
          code: "CNTR",
          nature: "CONTRA",
          numberingPrefix: "CNTR",
          autoNumbering: true,
        },
      }),
      prisma.voucherType.create({
        data: {
          name: "Sales",
          code: "SALE",
          nature: "SALES",
          numberingPrefix: "INV",
          autoNumbering: true,
        },
      }),
      prisma.voucherType.create({
        data: {
          name: "Purchase",
          code: "PURCH",
          nature: "PURCHASE",
          numberingPrefix: "BILL",
          autoNumbering: true,
        },
      }),
    ]);

    // Create default ledgers
    const cashBankGroup = ledgerGroups.find((g) => g.name === "Cash & Bank");

    if (cashBankGroup) {
      await prisma.ledger.create({
        data: {
          name: "Cash",
          groupId: cashBankGroup.id,
          isActive: true,
        },
      });

      await prisma.ledger.create({
        data: {
          name: "Petty Cash",
          groupId: cashBankGroup.id,
          isActive: true,
        },
      });
    }

    // Create default units of measure
    await Promise.all([
      prisma.unitOfMeasure.create({
        data: { name: "Numbers", symbol: "Nos", decimalPlaces: 0 },
      }),
      prisma.unitOfMeasure.create({
        data: { name: "Pieces", symbol: "Pcs", decimalPlaces: 0 },
      }),
      prisma.unitOfMeasure.create({
        data: { name: "Kilograms", symbol: "Kg", decimalPlaces: 2 },
      }),
      prisma.unitOfMeasure.create({
        data: { name: "Liters", symbol: "L", decimalPlaces: 2 },
      }),
      prisma.unitOfMeasure.create({
        data: { name: "Hours", symbol: "Hrs", decimalPlaces: 2 },
      }),
      prisma.unitOfMeasure.create({
        data: { name: "Days", symbol: "Days", decimalPlaces: 0 },
      }),
    ]);

    // Create default tax configs (Indian GST)
    await Promise.all([
      prisma.taxConfig.create({
        data: { name: "GST 0%", code: "GST0", taxType: "GST", rate: 0 },
      }),
      prisma.taxConfig.create({
        data: { name: "GST 5%", code: "GST5", taxType: "GST", rate: 5 },
      }),
      prisma.taxConfig.create({
        data: { name: "GST 12%", code: "GST12", taxType: "GST", rate: 12 },
      }),
      prisma.taxConfig.create({
        data: { name: "GST 18%", code: "GST18", taxType: "GST", rate: 18 },
      }),
      prisma.taxConfig.create({
        data: { name: "GST 28%", code: "GST28", taxType: "GST", rate: 28 },
      }),
    ]);

    // Create default warehouse
    await prisma.warehouse.create({
      data: {
        name: "Main Warehouse",
        code: "WH001",
        isDefault: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Accounting system initialized successfully",
      seeded: true,
      fiscalYear: fiscalYear.name,
      ledgerGroups: ledgerGroups.length,
    });
  } catch (error) {
    console.error("Error seeding accounting data:", error);
    return NextResponse.json(
      { error: "Failed to initialize accounting system" },
      { status: 500 }
    );
  }
}
