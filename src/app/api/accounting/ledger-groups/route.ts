import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createLedgerGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nature: z.enum(["ASSETS", "LIABILITIES", "INCOME", "EXPENSES", "EQUITY"]),
  parentId: z.string().optional().nullable(),
  affectsGrossProfit: z.boolean().optional().default(false),
  sequence: z.number().optional().default(0),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ledgerGroups = await prisma.ledgerGroup.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            nature: true,
          },
        },
        _count: {
          select: {
            ledgers: true,
          },
        },
      },
      orderBy: [{ nature: "asc" }, { sequence: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(ledgerGroups);
  } catch (error) {
    console.error("Error fetching ledger groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger groups" },
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
    const validatedData = createLedgerGroupSchema.parse(body);

    // Check if name already exists
    const existing = await prisma.ledgerGroup.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ledger group with this name already exists" },
        { status: 400 }
      );
    }

    const ledgerGroup = await prisma.ledgerGroup.create({
      data: validatedData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(ledgerGroup, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating ledger group:", error);
    return NextResponse.json(
      { error: "Failed to create ledger group" },
      { status: 500 }
    );
  }
}
