import { createHash } from 'crypto';

export interface DeviceInfo {
  browserName?: string;
  osName?: string;
  deviceType?: string; // "mobile" | "tablet" | "desktop"
  /**
   * Stable-ish hash of the UA + coarse client hints. Not cryptographically
   * unique, but a *change* in fingerprint across a session is a useful signal.
   */
  fingerprint: string;
}

function detectBrowser(ua: string): string | undefined {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/chrome\//i.test(ua)) return 'Chrome';
  if (/firefox\//i.test(ua)) return 'Firefox';
  if (/safari\//i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  return undefined;
}

function detectOs(ua: string): string | undefined {
  if (/windows nt/i.test(ua)) return 'Windows';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return undefined;
}

function detectDeviceType(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android.*mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Parse a user-agent (plus optional client-provided hints such as timezone,
 * screen size and language) into a device summary and a fingerprint hash.
 */
export function parseDevice(
  userAgent: string | null | undefined,
  hints?: { timezone?: string; screen?: string; language?: string; platform?: string },
): DeviceInfo {
  const ua = userAgent || '';
  const fingerprintSource = [
    ua,
    hints?.platform ?? '',
    hints?.timezone ?? '',
    hints?.screen ?? '',
    hints?.language ?? '',
  ].join('|');

  return {
    browserName: detectBrowser(ua),
    osName: detectOs(ua),
    deviceType: detectDeviceType(ua),
    fingerprint: createHash('sha256').update(fingerprintSource).digest('hex').slice(0, 32),
  };
}
