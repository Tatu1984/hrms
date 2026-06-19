import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { haversineKm, impliedSpeedKmh, type GeoInfo } from '@/lib/geo';
import type { DeviceInfo } from '@/lib/device';

export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface Anomaly {
  code: string;
  severity: AnomalySeverity;
  detail: string;
}

/** Speed (km/h) above which travel between two logins is physically implausible. */
const IMPOSSIBLE_TRAVEL_KMH = 900; // ~ commercial jet cruising speed

const SEVERITY_WEIGHT: Record<AnomalySeverity, number> = {
  low: 15,
  medium: 35,
  high: 60,
};

export interface AuthEventInput {
  eventType: AuthEventType;
  userId?: string | null;
  employeeId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  sessionId?: string | null;
  emailTried?: string | null;
  failureReason?: string | null;
  ipAddress?: string;
  userAgent?: string;
  geo?: GeoInfo;
  device?: DeviceInfo;
  clientTimezone?: string;
  anomalies?: Anomaly[];
  riskScore?: number;
}

/** Persist a single auth event row. Never throws into the caller's flow. */
export async function recordAuthEvent(input: AuthEventInput): Promise<void> {
  try {
    await prisma.authEvent.create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? null,
        employeeId: input.employeeId ?? null,
        userName: input.userName ?? null,
        userRole: input.userRole ?? null,
        sessionId: input.sessionId ?? null,
        emailTried: input.emailTried ?? null,
        failureReason: input.failureReason ?? null,
        ipAddress: input.ipAddress,
        city: input.geo?.city,
        district: input.geo?.district,
        region: input.geo?.region,
        postal: input.geo?.postal,
        country: input.geo?.country,
        latitude: input.geo?.latitude,
        longitude: input.geo?.longitude,
        geoSource: input.geo?.source,
        isp: input.geo?.isp,
        asn: input.geo?.asn,
        org: input.geo?.org,
        isVpnOrProxy: input.geo?.isVpnOrProxy,
        userAgent: input.userAgent,
        browserName: input.device?.browserName,
        osName: input.device?.osName,
        deviceType: input.device?.deviceType,
        deviceFingerprint: input.device?.fingerprint,
        clientTimezone: input.clientTimezone,
        riskScore: input.riskScore,
        anomalies:
          input.anomalies && input.anomalies.length
            ? (input.anomalies as unknown as Prisma.InputJsonValue)
            : undefined,
      },
    });
  } catch (err) {
    // Auditing must never block authentication; just log and move on.
    console.error('recordAuthEvent failed:', err);
  }
}

export interface AnomalyResult {
  anomalies: Anomaly[];
  riskScore: number;
}

/**
 * Inspect a user's recent auth history + live sessions to flag behavioral signals
 * that suggest concurrent/dual usage (e.g. moonlighting from another office):
 *  - concurrent active sessions from a different city/network
 *  - "impossible travel" between consecutive logins
 *  - VPN / proxy / hosting network
 *  - browser timezone not matching the IP's timezone
 *  - a never-before-seen device or country
 */
export async function detectLoginAnomalies(args: {
  userId: string;
  geo: GeoInfo;
  device: DeviceInfo;
  clientTimezone?: string;
  now?: Date;
}): Promise<AnomalyResult> {
  const { userId, geo, device, clientTimezone } = args;
  const now = args.now ?? new Date();
  const anomalies: Anomaly[] = [];

  // --- 1. Concurrent active sessions from a different place / network --------
  const liveSessions = await prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { lastSeenAt: 'desc' },
    take: 20,
  });

  for (const s of liveSessions) {
    const differentCity = geo.city && s.city && geo.city !== s.city;
    const differentAsn = geo.asn && s.asn && geo.asn !== s.asn;
    const farApart = haversineKm(geo, s);
    if (differentCity || differentAsn || (farApart != null && farApart > 100)) {
      anomalies.push({
        code: 'CONCURRENT_SESSION_DIFFERENT_LOCATION',
        severity: 'high',
        detail: `Another active session from ${s.city ?? s.ipAddress ?? 'unknown'}${
          s.asn ? ` (${s.asn})` : ''
        } while logging in from ${geo.city ?? 'unknown'}${geo.asn ? ` (${geo.asn})` : ''}.`,
      });
      break;
    }
  }

  // --- 2. Impossible travel vs the last successful login --------------------
  const lastLogin = await prisma.authEvent.findFirst({
    where: {
      userId,
      eventType: 'LOGIN_SUCCESS',
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (lastLogin && geo.latitude != null && geo.longitude != null) {
    const distance = haversineKm(geo, lastLogin);
    if (distance != null && distance > 50) {
      const elapsed = now.getTime() - lastLogin.createdAt.getTime();
      const speed = impliedSpeedKmh(distance, elapsed);
      if (speed > IMPOSSIBLE_TRAVEL_KMH) {
        anomalies.push({
          code: 'IMPOSSIBLE_TRAVEL',
          severity: 'high',
          detail: `${Math.round(distance)} km from previous login in ${Math.round(
            elapsed / 60000,
          )} min (~${Math.round(speed)} km/h).`,
        });
      }
    }
  }

  // --- 3. VPN / proxy / hosting network -------------------------------------
  if (geo.isVpnOrProxy) {
    anomalies.push({
      code: 'VPN_OR_PROXY',
      severity: 'medium',
      detail: `Login network flagged as VPN/proxy/hosting${geo.isp ? ` (${geo.isp})` : ''}.`,
    });
  }

  // --- 4. Browser timezone vs IP timezone mismatch --------------------------
  if (clientTimezone && geo.ipTimezone && clientTimezone !== geo.ipTimezone) {
    anomalies.push({
      code: 'TIMEZONE_MISMATCH',
      severity: 'medium',
      detail: `Browser timezone ${clientTimezone} differs from IP timezone ${geo.ipTimezone}.`,
    });
  }

  // --- 5. New device fingerprint --------------------------------------------
  const seenDevice = await prisma.authEvent.findFirst({
    where: { userId, deviceFingerprint: device.fingerprint, eventType: 'LOGIN_SUCCESS' },
    select: { id: true },
  });
  if (!seenDevice) {
    anomalies.push({
      code: 'NEW_DEVICE',
      severity: 'low',
      detail: `First login from this device (${device.browserName ?? 'unknown'} on ${
        device.osName ?? 'unknown'
      }).`,
    });
  }

  // --- 6. New country -------------------------------------------------------
  if (geo.country) {
    const seenCountry = await prisma.authEvent.findFirst({
      where: { userId, country: geo.country, eventType: 'LOGIN_SUCCESS' },
      select: { id: true },
    });
    if (!seenCountry) {
      anomalies.push({
        code: 'NEW_COUNTRY',
        severity: 'medium',
        detail: `First login from ${geo.country}.`,
      });
    }
  }

  // --- 7. Unusual locality: an established user appearing from a new city ----
  // Only fires once the user has a login history, so brand-new users aren't
  // flagged on every early login. This is the core "logged in from somewhere
  // they don't normally" signal.
  if (geo.city) {
    const priorLogins = await prisma.authEvent.count({
      where: { userId, eventType: 'LOGIN_SUCCESS' },
    });
    if (priorLogins >= 3) {
      const seenCity = await prisma.authEvent.findFirst({
        where: { userId, city: geo.city, eventType: 'LOGIN_SUCCESS' },
        select: { id: true },
      });
      if (!seenCity) {
        anomalies.push({
          code: 'UNUSUAL_LOCALITY',
          severity: 'medium',
          detail: `Login from ${[geo.district, geo.city].filter(Boolean).join(', ')} — not a place this user normally logs in from.`,
        });
      }
    }
  }

  const riskScore = Math.min(
    100,
    anomalies.reduce((sum, a) => sum + SEVERITY_WEIGHT[a.severity], 0),
  );

  return { anomalies, riskScore };
}
