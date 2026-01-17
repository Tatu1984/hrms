import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createPartySchema = z.object({
  type: z.enum(["CUSTOMER", "VENDOR", "BOTH"]),
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPostal: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingPostal: z.string().optional(),
  gstNo: z.string().optional(),
  panNo: z.string().optional(),
  gstRegistrationType: z.string().optional(),
  creditLimit: z.number().optional(),
  creditDays: z.number().optional(),
  paymentTerms: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfsc: z.string().optional(),
  openingBalance: z.number().optional().default(0),
  openingBalanceType: z.enum(["DR", "CR"]).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (type && type !== "all") {
      if (type === "CUSTOMER") {
        where.OR = [{ type: "CUSTOMER" }, { type: "BOTH" }];
      } else if (type === "VENDOR") {
        where.OR = [{ type: "VENDOR" }, { type: "BOTH" }];
      } else {
        where.type = type;
      }
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { gstNo: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const parties = await prisma.party.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(parties);
  } catch (error) {
    console.error("Error fetching parties:", error);
    return NextResponse.json(
      { error: "Failed to fetch parties" },
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
    const validatedData = createPartySchema.parse(body);

    // Check if name already exists
    const existing = await prisma.party.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Party with this name already exists" },
        { status: 400 }
      );
    }

    // Handle empty email
    const data = { ...validatedData };
    if (data.email === "") {
      delete data.email;
    }

    const party = await prisma.party.create({
      data: {
        ...data,
        currentBalance: data.openingBalance || 0,
      },
    });

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating party:", error);
    return NextResponse.json(
      { error: "Failed to create party" },
      { status: 500 }
    );
  }
}
