/**
 * SSRF guard for admin-supplied outbound URLs (e.g. Azure DevOps / Confluence
 * `organizationUrl`). Ensures a URL is https and points at a public host, so a
 * server-side fetch can't be pointed at localhost, cloud metadata endpoints, or
 * private/internal network ranges.
 *
 * Throws an Error (message safe to surface to the caller) when the URL is not
 * an acceptable public https target; returns the parsed URL otherwise.
 */

function ipv4ToOctets(host: string): number[] | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const octets = m.slice(1).map((n) => Number(n));
  if (octets.some((o) => o < 0 || o > 255)) return null;
  return octets;
}

function isPrivateIpv4(octets: number[]): boolean {
  const [a, b] = octets;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. 169.254.169.254 metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === '::1' || h === '::') return true; // loopback / unspecified
  if (h.startsWith('fe80')) return true; // link-local
  if (h.startsWith('fc') || h.startsWith('fd')) return true; // unique local fc00::/7
  // IPv4-mapped (e.g. ::ffff:127.0.0.1)
  const mapped = h.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) {
    const octets = ipv4ToOctets(mapped[1]);
    if (octets && isPrivateIpv4(octets)) return true;
  }
  return false;
}

export function assertPublicHttpsUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'https:') {
    throw new Error('URL must use https');
  }

  // URL#hostname strips brackets from IPv6 literals.
  const host = url.hostname.toLowerCase();

  if (!host) {
    throw new Error('URL must include a host');
  }

  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new Error('URL host is not allowed');
  }

  const ipv4 = ipv4ToOctets(host);
  if (ipv4) {
    if (isPrivateIpv4(ipv4)) {
      throw new Error('URL host is not allowed');
    }
    // Reject bare public IPs too: integrations use real hostnames, and raw IPs
    // are a common SSRF bypass vector.
    throw new Error('URL host must be a hostname, not an IP address');
  }

  // IPv6 literal (contains a colon) — reject private/internal, and raw IPs.
  if (host.includes(':')) {
    if (isPrivateIpv6(host)) {
      throw new Error('URL host is not allowed');
    }
    throw new Error('URL host must be a hostname, not an IP address');
  }

  // Reject hostnames without a dot (e.g. internal short names like "intranet").
  if (!host.includes('.')) {
    throw new Error('URL host is not allowed');
  }

  return url;
}
