import { describe, it, expect } from 'vitest';
import { assertPublicHttpsUrl, INTEGRATION_ALLOWED_HOSTS } from './url-guard';

const AZ = INTEGRATION_ALLOWED_HOSTS.AZURE_DEVOPS;
const CONF = INTEGRATION_ALLOWED_HOSTS.CONFLUENCE;

describe('assertPublicHttpsUrl — base SSRF guard', () => {
  it('accepts a public https hostname', () => {
    expect(() => assertPublicHttpsUrl('https://dev.azure.com/org')).not.toThrow();
  });

  it('rejects non-https', () => {
    expect(() => assertPublicHttpsUrl('http://dev.azure.com')).toThrow(/https/);
  });

  it('rejects localhost and loopback', () => {
    expect(() => assertPublicHttpsUrl('https://localhost/x')).toThrow();
    expect(() => assertPublicHttpsUrl('https://127.0.0.1/x')).toThrow();
  });

  it('rejects the cloud metadata endpoint and private ranges', () => {
    expect(() => assertPublicHttpsUrl('https://169.254.169.254/latest/meta-data')).toThrow();
    expect(() => assertPublicHttpsUrl('https://10.0.0.5')).toThrow();
    expect(() => assertPublicHttpsUrl('https://192.168.1.1')).toThrow();
    expect(() => assertPublicHttpsUrl('https://172.16.0.1')).toThrow();
  });

  it('rejects IPv6 loopback / link-local and IPv4-mapped private', () => {
    expect(() => assertPublicHttpsUrl('https://[::1]/x')).toThrow();
    expect(() => assertPublicHttpsUrl('https://[fe80::1]/x')).toThrow();
    expect(() => assertPublicHttpsUrl('https://[::ffff:127.0.0.1]/x')).toThrow();
  });

  it('rejects bare public IPs and dotless internal names', () => {
    expect(() => assertPublicHttpsUrl('https://8.8.8.8')).toThrow(/IP address/);
    expect(() => assertPublicHttpsUrl('https://intranet/x')).toThrow();
  });
});

describe('integration host allow-list — DNS-rebinding defense', () => {
  it('accepts the real production integration hosts', () => {
    expect(() => assertPublicHttpsUrl('https://dev.azure.com/InfinititechPartners', AZ)).not.toThrow();
    expect(() => assertPublicHttpsUrl('https://tensparrows.visualstudio.com/', AZ)).not.toThrow();
    expect(() => assertPublicHttpsUrl('https://scaledventuresai.atlassian.net', CONF)).not.toThrow();
  });

  it('rejects an attacker hostname even though it is a valid public host', () => {
    // The core rebinding case: evil.com passes the base guard (public, https,
    // has a dot) but is not an allow-listed integration host.
    expect(() => assertPublicHttpsUrl('https://evil.com/x', AZ)).toThrow(/allowed integration host/);
    expect(() => assertPublicHttpsUrl('https://evil.com/x', CONF)).toThrow(/allowed integration host/);
  });

  it('does not allow cross-platform hosts', () => {
    expect(() => assertPublicHttpsUrl('https://dev.azure.com/org', CONF)).toThrow();
    expect(() => assertPublicHttpsUrl('https://x.atlassian.net', AZ)).toThrow();
  });

  it('rejects look-alike suffix tricks', () => {
    expect(() => assertPublicHttpsUrl('https://dev.azure.com.evil.com', AZ)).toThrow();
    expect(() => assertPublicHttpsUrl('https://atlassian.net.evil.com', CONF)).toThrow();
  });
});
