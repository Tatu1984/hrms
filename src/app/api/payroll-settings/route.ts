import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere, withOrg } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      pfPercentage,
      esiPercentage,
      esiWageCeiling,
      professionalTax,
      tdsSlabs,
      applyPf,
      applyEsi,
      applyTds,
      applyProfessionalTax,
      basicSalaryPercentage,
      variablePayPercentage,
    } = body;

    // Check if settings exist
    const existing = await prisma.salaryConfig.findFirst({
      where: { ...orgWhere(session) },
    });

    const num = (v: unknown, d: number) => {
      const n = parseFloat(String(v));
      return Number.isFinite(n) ? n : d;
    };
    const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

    const settingsData = {
      pfPercentage: num(pfPercentage, existing?.pfPercentage ?? 12),
      esiPercentage: num(esiPercentage, existing?.esiPercentage ?? 0.75),
      esiWageCeiling: num(esiWageCeiling, existing?.esiWageCeiling ?? 21000),
      professionalTax: num(professionalTax, existing?.professionalTax ?? 200),
      // tdsSlabs: [{ upTo: number|null, rate: number }]; undefined => leave unchanged
      tdsSlabs: Array.isArray(tdsSlabs) ? tdsSlabs : undefined,
      applyPf: bool(applyPf, existing?.applyPf ?? false),
      applyEsi: bool(applyEsi, existing?.applyEsi ?? false),
      applyTds: bool(applyTds, existing?.applyTds ?? false),
      applyProfessionalTax: bool(applyProfessionalTax, existing?.applyProfessionalTax ?? true),
      bonusRules: {
        basicSalaryPercentage: num(basicSalaryPercentage, 70),
        variablePayPercentage: num(variablePayPercentage, 30),
      },
    };

    let settings;
    if (existing) {
      settings = await prisma.salaryConfig.update({
        where: { id: existing.id },
        data: settingsData,
      });
    } else {
      settings = await prisma.salaryConfig.create({
        data: withOrg(session, settingsData),
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating payroll settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    const settings = await prisma.salaryConfig.findFirst({
      where: { ...orgWhere(session) },
    });
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Error fetching payroll settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
