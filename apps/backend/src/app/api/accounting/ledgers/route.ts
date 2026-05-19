import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createLedgerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
  groupId: z.string().min(1, "Group is required"),
  partyId: z.string().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
  openingBalance: z.number().default(0),
  openingBalanceType: z.enum(["DR", "CR"]).optional().nullable(),
  gstNo: z.string().optional().nullable(),
  panNo: z.string().optional().nullable(),
  gstRegistrationType: z.string().optional().nullable(),
  creditLimit: z.number().optional().nullable(),
  creditDays: z.number().optional().nullable(),
  tdsApplicable: z.boolean().optional().default(false),
  tdsRate: z.number().optional().nullable(),
  isBillwise: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const nature = searchParams.get("nature");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (groupId) {
      where.groupId = groupId;
    }

    if (nature) {
      where.group = { nature };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const ledgers = await prisma.ledger.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            nature: true,
          },
        },
        party: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(ledgers);
  } catch (error) {
    console.error("Error fetching ledgers:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledgers" },
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
    const validatedData = createLedgerSchema.parse(body);

    // Check if name already exists
    const existing = await prisma.ledger.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ledger with this name already exists" },
        { status: 400 }
      );
    }

    const ledger = await prisma.ledger.create({
      data: {
        ...validatedData,
        currentBalance: validatedData.openingBalance,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            nature: true,
          },
        },
      },
    });

    return NextResponse.json(ledger, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating ledger:", error);
    return NextResponse.json(
      { error: "Failed to create ledger" },
      { status: 500 }
    );
  }
}
