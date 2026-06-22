import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { trustedKeysFor } from '@/lib/auth-audit';

/** Risk threshold (medium severity and up) for surfacing a login as suspicious. */
const RISK_THRESHOLD = 35;
const LOOKBACK_HOURS = 48;

/**
 * Admin-wide alert bar shown when there have been suspicious logins recently
 * (unusual locality, impossible travel, VPN, concurrent sessions, etc.).
 * Renders nothing when all is quiet. Server component — queries directly.
 */
export default async function SuspiciousLoginBanner() {
  let count = 0;
  let latestName: string | null = null;

  try {
    const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);
    const flagged = await prisma.authEvent.findMany({
      where: {
        eventType: 'LOGIN_SUCCESS',
        createdAt: { gt: since },
        riskScore: { gte: RISK_THRESHOLD },
      },
      orderBy: { createdAt: 'desc' },
      select: { userId: true, userName: true, ipAddress: true },
    });

    // Drop logins the admin has already approved (their IP is allowlisted).
    const trustedKeys = await trustedKeysFor(
      flagged.map((e) => e.userId).filter((id): id is string => Boolean(id)),
    );
    const unresolved = flagged.filter(
      (e) => !(e.userId && e.ipAddress && trustedKeys.has(`${e.userId}|${e.ipAddress}`)),
    );
    count = unresolved.length;
    latestName = unresolved[0]?.userName ?? null;
  } catch {
    return null; // Never let the banner break the admin shell.
  }

  if (count === 0) return null;

  return (
    <Link
      href="/admin/login-audit"
      className="flex items-center gap-3 bg-red-600 text-white px-4 py-2.5 text-sm hover:bg-red-700 transition-colors"
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1">
        <strong>{count} suspicious login{count === 1 ? '' : 's'}</strong> in the last{' '}
        {LOOKBACK_HOURS}h
        {latestName ? ` (most recent: ${latestName})` : ''} — review the Login Audit.
      </span>
      <span className="underline font-medium shrink-0">Review →</span>
    </Link>
  );
}
