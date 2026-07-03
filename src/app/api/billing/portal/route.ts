import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getStripe, isBillingConfigured } from '@/lib/billing';

export const runtime = 'nodejs';

// POST /api/billing/portal - Open the Stripe Billing Portal to manage the subscription.
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!isBillingConfigured()) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
    }
    if (!session.organizationId) {
      return NextResponse.json({ error: 'No organization for this account' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });
    if (!org?.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing customer yet' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const stripe = getStripe();

    const portal = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appUrl}/admin/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 });
  }
}
