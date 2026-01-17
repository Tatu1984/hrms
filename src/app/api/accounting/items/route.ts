import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["GOODS", "SERVICES"]).default("GOODS"),
  categoryId: z.string().optional().nullable(),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  primaryUnitId: z.string().min(1, "Unit is required"),
  purchasePrice: z.number().optional(),
  sellingPrice: z.number().optional(),
  mrp: z.number().optional(),
  minStock: z.number().optional(),
  maxStock: z.number().optional(),
  reorderLevel: z.number().optional(),
  reorderQty: z.number().optional(),
  valuationMethod: z.enum(["FIFO", "LIFO", "WEIGHTED_AVG"]).default("WEIGHTED_AVG"),
  trackBatch: z.boolean().optional().default(false),
  trackSerial: z.boolean().optional().default(false),
  trackExpiry: z.boolean().optional().default(false),
  purchaseTaxId: z.string().optional().nullable(),
  salesTaxId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryUnit: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
        stocks: {
          select: {
            warehouseId: true,
            quantity: true,
            avgCost: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
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
    const validatedData = createItemSchema.parse(body);

    // Check if name already exists
    const existingName = await prisma.item.findUnique({
      where: { name: validatedData.name },
    });

    if (existingName) {
      return NextResponse.json(
        { error: "Item with this name already exists" },
        { status: 400 }
      );
    }

    // Check if SKU already exists (if provided)
    if (validatedData.sku) {
      const existingSku = await prisma.item.findUnique({
        where: { sku: validatedData.sku },
      });

      if (existingSku) {
        return NextResponse.json(
          { error: "Item with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    const item = await prisma.item.create({
      data: validatedData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryUnit: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
