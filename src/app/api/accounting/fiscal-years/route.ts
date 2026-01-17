import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createFiscalYearSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fiscalYears = await prisma.fiscalYear.findMany({
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(fiscalYears);
  } catch (error) {
    console.error("Error fetching fiscal years:", error);
    return NextResponse.json(
      { error: "Failed to fetch fiscal years" },
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
    const validatedData = createFiscalYearSchema.parse(body);

    // Check if name already exists
    const existing = await prisma.fiscalYear.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Fiscal year with this name already exists" },
        { status: 400 }
      );
    }

    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        name: validatedData.name,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
      },
    });

    return NextResponse.json(fiscalYear, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating fiscal year:", error);
    return NextResponse.json(
      { error: "Failed to create fiscal year" },
      { status: 500 }
    );
  }
}
