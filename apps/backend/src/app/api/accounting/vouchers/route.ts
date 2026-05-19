import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const voucherEntrySchema = z.object({
  ledgerId: z.string().min(1, "Ledger is required"),
  debitAmount: z.number().min(0).default(0),
  creditAmount: z.number().min(0).default(0),
  narration: z.string().optional(),
  costCenterId: z.string().optional().nullable(),
});

const createVoucherSchema = z.object({
  voucherTypeId: z.string().min(1, "Voucher type is required"),
  fiscalYearId: z.string().min(1, "Fiscal year is required"),
  date: z.string().min(1, "Date is required"),
  narration: z.string().optional(),
  referenceNo: z.string().optional(),
  entries: z.array(voucherEntrySchema).min(2, "At least 2 entries required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const voucherTypeId = searchParams.get("voucherTypeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (voucherTypeId) {
      where.voucherTypeId = voucherTypeId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { voucherNumber: { contains: search, mode: "insensitive" } },
        { narration: { contains: search, mode: "insensitive" } },
        { referenceNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: {
          voucherType: {
            select: {
              id: true,
              name: true,
              code: true,
              nature: true,
            },
          },
          entries: {
            include: {
              ledger: {
                select: {
                  id: true,
                  name: true,
                  group: {
                    select: {
                      name: true,
                      nature: true,
                    },
                  },
                },
              },
            },
            orderBy: { sequence: "asc" },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ]);

    return NextResponse.json({
      data: vouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createVoucherSchema.parse(body);

    // Validate double-entry: total debit must equal total credit
    const totalDebit = validatedData.entries.reduce(
      (sum, e) => sum + e.debitAmount,
      0
    );
    const totalCredit = validatedData.entries.reduce(
      (sum, e) => sum + e.creditAmount,
      0
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: "Total debit must equal total credit" },
        { status: 400 }
      );
    }

    // Get voucher type for numbering
    const voucherType = await prisma.voucherType.findUnique({
      where: { id: validatedData.voucherTypeId },
    });

    if (!voucherType) {
      return NextResponse.json(
        { error: "Invalid voucher type" },
        { status: 400 }
      );
    }

    // Generate voucher number
    const lastVoucher = await prisma.voucher.findFirst({
      where: { voucherTypeId: validatedData.voucherTypeId },
      orderBy: { createdAt: "desc" },
    });

    const nextNumber = lastVoucher
      ? parseInt(lastVoucher.voucherNumber.split("/").pop() || "0") + 1
      : 1;

    const voucherNumber = `${voucherType.numberingPrefix || voucherType.code}/${new Date().getFullYear()}/${nextNumber.toString().padStart(5, "0")}`;

    // Create voucher with entries in transaction and update ledger balances
    const voucher = await prisma.$transaction(async (tx) => {
      const newVoucher = await tx.voucher.create({
        data: {
          voucherTypeId: validatedData.voucherTypeId,
          fiscalYearId: validatedData.fiscalYearId,
          voucherNumber,
          date: new Date(validatedData.date),
          narration: validatedData.narration,
          referenceNo: validatedData.referenceNo,
          totalDebit,
          totalCredit,
          status: "APPROVED", // Auto-approve for now
          isPosted: true,
          postedAt: new Date(),
          entries: {
            create: validatedData.entries.map((entry, index) => ({
              ledgerId: entry.ledgerId,
              debitAmount: entry.debitAmount,
              creditAmount: entry.creditAmount,
              narration: entry.narration,
              costCenterId: entry.costCenterId,
              sequence: index + 1,
            })),
          },
        },
        include: {
          voucherType: true,
          entries: {
            include: {
              ledger: true,
            },
          },
        },
      });

      // Update ledger balances
      for (const entry of validatedData.entries) {
        const ledger = await tx.ledger.findUnique({
          where: { id: entry.ledgerId },
          include: { group: true },
        });

        if (ledger) {
          // For Assets and Expenses: Debit increases, Credit decreases
          // For Liabilities, Income, Equity: Credit increases, Debit decreases
          const isDebitNature = ["ASSETS", "EXPENSES"].includes(
            ledger.group.nature
          );
          const balanceChange = isDebitNature
            ? entry.debitAmount - entry.creditAmount
            : entry.creditAmount - entry.debitAmount;

          await tx.ledger.update({
            where: { id: entry.ledgerId },
            data: {
              currentBalance: {
                increment: balanceChange,
              },
            },
          });
        }
      }

      return newVoucher;
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating voucher:", error);
    return NextResponse.json(
      { error: "Failed to create voucher" },
      { status: 500 }
    );
  }
}
