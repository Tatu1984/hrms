import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBankAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  branch: z.string().optional(),
  accountNumber: z.string().min(1, "Account number is required"),
  ifscCode: z.string().optional(),
  swiftCode: z.string().optional(),
  accountType: z.enum(["CURRENT", "SAVINGS", "CC", "OD"]),
  openingBalance: z.number().optional().default(0),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bankAccounts = await prisma.acctBankAccount.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBankAccountSchema.parse(body);

    // Check if account number already exists
    const existing = await prisma.acctBankAccount.findUnique({
      where: { accountNumber: validatedData.accountNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bank account with this account number already exists" },
        { status: 400 }
      );
    }

    const bankAccount = await prisma.acctBankAccount.create({
      data: {
        ...validatedData,
        currentBalance: validatedData.openingBalance,
      },
    });

    // Also create a corresponding ledger
    let bankGroup = await prisma.ledgerGroup.findFirst({
      where: { name: "Cash & Bank" },
    });

    if (!bankGroup) {
      bankGroup = await prisma.ledgerGroup.create({
        data: {
          name: "Cash & Bank",
          nature: "ASSETS",
          isSystem: true,
        },
      });
    }

    await prisma.ledger.create({
      data: {
        name: `${validatedData.bankName} - ${validatedData.accountNumber.slice(-4)}`,
        groupId: bankGroup.id,
        bankAccountId: bankAccount.id,
        openingBalance: validatedData.openingBalance,
        currentBalance: validatedData.openingBalance,
        openingBalanceType: "DR",
      },
    });

    return NextResponse.json(bankAccount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: "Failed to create bank account" },
      { status: 500 }
    );
  }
}
