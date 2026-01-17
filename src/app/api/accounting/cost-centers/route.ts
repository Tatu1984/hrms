import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createCostCenterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const costCenters = await prisma.acctCostCenter.findMany({
      where: { isActive: true },
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
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(costCenters);
  } catch (error) {
    console.error("Error fetching cost centers:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost centers" },
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
    const validatedData = createCostCenterSchema.parse(body);

    // Check if name already exists
    const existing = await prisma.acctCostCenter.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Cost center with this name already exists" },
        { status: 400 }
      );
    }

    const costCenter = await prisma.acctCostCenter.create({
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

    return NextResponse.json(costCenter, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating cost center:", error);
    return NextResponse.json(
      { error: "Failed to create cost center" },
      { status: 500 }
    );
  }
}
