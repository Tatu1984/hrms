import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { orgWhere, withOrg } from "@/lib/tenant";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createCostCenterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const costCenters = await prisma.acctCostCenter.findMany({
      where: { isActive: true, ...orgWhere(session) },
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
    // RBAC: only ADMIN/MANAGER may create accounting records.
    const auth = await requireRole("ADMIN", "MANAGER");
    if (auth instanceof NextResponse) return auth;

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
      data: withOrg(auth, validatedData),
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
