import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { getStripe, isBillingConfigured } from '@/lib/billing';

// Must run on Node (raw body + Stripe SDK crypto). This route is PUBLIC — it is
// authenticated by the Stripe webhook signature, not by a session cookie, so it
// must be allow-listed in middleware.
export const runtime = 'nodejs';

// POST /api/webhooks/stripe - Stripe webhook receiver.
export async function POST(request: Request) {
  if (!isBillingConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 400 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Read the RAW body — do NOT call request.json(), signature verification
  // needs the exact bytes Stripe signed.
  const rawBody = await request.text();

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const cs = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof cs.customer === 'string' ? cs.customer : cs.customer?.id;
        const subscriptionId =
          typeof cs.subscription === 'string' ? cs.subscription : cs.subscription?.id ?? null;
        if (customerId) {
          // Fetch the subscription to capture status + period end.
          let subscription: Stripe.Subscription | null = null;
          if (subscriptionId) {
            subscription = await stripe.subscriptions.retrieve(subscriptionId);
          }
          await applySubscription(customerId, subscription, subscriptionId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        await applySubscription(customerId, sub, sub.id);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan: 'free',
            subscriptionStatus: sub.status ?? 'canceled',
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          },
        });
        break;
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error(`Error handling Stripe webhook (${event.type}):`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Mark the org as pro/free based on the subscription's status. */
async function applySubscription(
  customerId: string,
  subscription: Stripe.Subscription | null,
  subscriptionId: string | null,
) {
  const status = subscription?.status ?? null;
  const active = status === 'active' || status === 'trialing';

  // current_period_end lives on the subscription (or its items depending on API
  // version); read defensively.
  let periodEnd: Date | null = null;
  const raw = subscription as unknown as Record<string, any> | null;
  const periodEndUnix: number | undefined =
    raw?.current_period_end ?? raw?.items?.data?.[0]?.current_period_end;
  if (typeof periodEndUnix === 'number') {
    periodEnd = new Date(periodEndUnix * 1000);
  }

  await prisma.organization.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: active ? 'pro' : 'free',
      subscriptionStatus: status,
      stripeSubscriptionId: subscriptionId,
      currentPeriodEnd: periodEnd,
    },
  });
}
