import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createVoucherTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  nature: z.enum([
    "PAYMENT",
    "RECEIPT",
    "CONTRA",
    "JOURNAL",
    "SALES",
    "PURCHASE",
    "DEBIT_NOTE",
    "CREDIT_NOTE",
  ]),
  numberingPrefix: z.string().optional(),
  numberingFormat: z.string().optional(),
  autoNumbering: z.boolean().optional().default(true),
  requiresApproval: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voucherTypes = await prisma.voucherType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(voucherTypes);
  } catch (error) {
    console.error("Error fetching voucher types:", error);
    return NextResponse.json(
      { error: "Failed to fetch voucher types" },
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
    const validatedData = createVoucherTypeSchema.parse(body);

    // Check if code already exists
    const existing = await prisma.voucherType.findUnique({
      where: { code: validatedData.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Voucher type with this code already exists" },
        { status: 400 }
      );
    }

    const voucherType = await prisma.voucherType.create({
      data: validatedData,
    });

    return NextResponse.json(voucherType, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating voucher type:", error);
    return NextResponse.json(
      { error: "Failed to create voucher type" },
      { status: 500 }
    );
  }
}
