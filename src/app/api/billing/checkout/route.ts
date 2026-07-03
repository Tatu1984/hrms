import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getStripe, isBillingConfigured, PLANS } from '@/lib/billing';

export const runtime = 'nodejs';

// POST /api/billing/checkout - Start a Stripe Checkout session to upgrade to Pro.
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

    const priceId = PLANS.pro.priceId;
    if (!priceId) {
      return NextResponse.json({ error: 'Pro price is not configured' }, { status: 503 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const stripe = getStripe();

    // Ensure a Stripe customer exists for this org.
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name ?? undefined,
        email: session.email,
        metadata: { organizationId: org.id },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/admin/billing?checkout=success`,
      cancel_url: `${appUrl}/admin/billing?checkout=cancelled`,
      metadata: { organizationId: org.id },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
