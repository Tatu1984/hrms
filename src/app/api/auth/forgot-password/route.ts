import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getClientIp } from '@/lib/ip';
import { createResetToken } from '@/lib/password-reset';
import { sendEmail } from '@/lib/mailer';

/**
 * Request a password-reset link. ALWAYS returns 200 `{ ok: true }` regardless of
 * whether the email maps to a real account, so this endpoint can't be used to
 * enumerate registered users. If the account exists, a single-use reset link is
 * emailed (or logged, if no mailer is configured).
 */

/**
 * Abuse throttle: cap reset requests per IP within a window. Mirrors the
 * in-module sliding-window pattern used by the signup route.
 */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, number[]>();

function isRateLimited(...keys: string[]): boolean {
  const now = Date.now();
  const since = now - WINDOW_MS;
  let limited = false;
  for (const key of keys) {
    if (!key) continue;
    const recent = (attempts.get(key) || []).filter((t) => t > since);
    recent.push(now);
    attempts.set(key, recent);
    if (recent.length > MAX_ATTEMPTS) limited = true;
  }
  return limited;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();

    if (isRateLimited(`ip:${ip}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    if (email) {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        const rawToken = await createResetToken(user.id);
        const link = `${process.env.NEXT_PUBLIC_APP_URL || ''}/reset-password?token=${rawToken}`;
        await sendEmail({
          to: email,
          subject: 'Reset your HRMS password',
          text: `Reset your password using this link (valid for 1 hour):\n\n${link}\n\nIf you didn't request this, you can ignore this email.`,
          html: `
            <p>We received a request to reset your HRMS password.</p>
            <p><a href="${link}">Click here to reset your password</a> — this link is valid for 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `,
        });
      }
    }

    // Never reveal whether the email exists.
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot-password error:', error);
    // Still avoid leaking anything; respond as if it succeeded.
    return NextResponse.json({ ok: true });
  }
}
