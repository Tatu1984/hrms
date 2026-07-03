import type Stripe from 'stripe';

/**
 * Stripe billing with graceful degradation.
 *
 * When Stripe env vars are absent, billing is simply "not configured": the app
 * keeps working, every org stays on the free plan, and the billing UI shows a
 * muted "not enabled" message instead of upgrade buttons. Imports are kept lazy
 * so importing this module never crashes a deployment that has no Stripe keys.
 */

export interface PlanDefinition {
  /** Human-readable plan name. */
  name: string;
  /** Stripe Price id for this plan, or null for plans that aren't purchasable (free). */
  priceId: string | null;
  /** Max seats (employees/users) allowed. null = unlimited. */
  seatLimit: number | null;
}

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    name: 'Free',
    priceId: null,
    seatLimit: 5,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
    seatLimit: 100,
  },
};

export const DEFAULT_PLAN = 'free';

/** Billing is enabled iff we have a Stripe secret key on this deployment. */
export function isBillingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Cache the Stripe client across warm serverless invocations.
let stripeClient: Stripe | null = null;

/**
 * Lazily construct (and cache) a Stripe client. Throws a clear error if called
 * while billing is not configured — callers should gate on isBillingConfigured()
 * first and return a 503.
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe is not configured (STRIPE_SECRET_KEY is not set).');
  }
  if (!stripeClient) {
    // Require lazily so this module is import-safe without the key present.
    // The stripe package's CommonJS export IS the constructor.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const StripeCtor: typeof Stripe = require('stripe');
    stripeClient = new StripeCtor(secretKey, {
      // Pin an apiVersion loosely to avoid the fussy literal-type mismatch
      // between the installed SDK's expected version and ours.
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });
  }
  return stripeClient;
}

/** The current plan key for an organization, falling back to free. */
export function getPlanForOrg(org: { plan?: string | null } | null | undefined): string {
  const plan = org?.plan;
  if (plan && PLANS[plan]) return plan;
  return DEFAULT_PLAN;
}

/** Seat limit for a plan key (null = unlimited). Unknown plans fall back to free. */
export function getSeatLimit(plan: string | null | undefined): number | null {
  const def = plan && PLANS[plan] ? PLANS[plan] : PLANS[DEFAULT_PLAN];
  return def.seatLimit;
}
