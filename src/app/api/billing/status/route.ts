import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getPlanForOrg, getSeatLimit, isBillingConfigured, PLANS } from '@/lib/billing';

export const runtime = 'nodejs';

// GET /api/billing/status - Current plan/subscription info for the caller's org.
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const configured = isBillingConfigured();

    let org: {
      plan: string | null;
      subscriptionStatus: string | null;
      currentPeriodEnd: Date | null;
    } | null = null;

    if (session.organizationId) {
      org = await prisma.organization.findUnique({
        where: { id: session.organizationId },
        select: { plan: true, subscriptionStatus: true, currentPeriodEnd: true },
      });
    }

    const plan = getPlanForOrg(org);

    return NextResponse.json({
      configured,
      plan,
      planName: PLANS[plan]?.name ?? plan,
      seatLimit: getSeatLimit(plan),
      subscriptionStatus: org?.subscriptionStatus ?? null,
      currentPeriodEnd: org?.currentPeriodEnd ?? null,
    });
  } catch (error) {
    console.error('Error fetching billing status:', error);
    return NextResponse.json({ error: 'Failed to fetch billing status' }, { status: 500 });
  }
}
