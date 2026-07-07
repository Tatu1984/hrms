import { describe, it, expect } from 'vitest';
import { parseDevice } from './device';

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const EDGE_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

describe('parseDevice - detection', () => {
  it('detects Chrome on Windows desktop', () => {
    const d = parseDevice(CHROME_WIN);
    expect(d.browserName).toBe('Chrome');
    expect(d.osName).toBe('Windows');
    expect(d.deviceType).toBe('desktop');
  });

  it('detects Safari on iOS as a mobile device (Chrome token absent)', () => {
    const d = parseDevice(SAFARI_IPHONE);
    expect(d.browserName).toBe('Safari');
    expect(d.osName).toBe('iOS');
    expect(d.deviceType).toBe('mobile');
  });

  it('prefers Edge over Chrome when the Edg/ token is present', () => {
    expect(parseDevice(EDGE_WIN).browserName).toBe('Edge');
  });

  it('handles a missing user-agent: undefined fields but still a desktop default + fingerprint', () => {
    const d = parseDevice(null);
    expect(d.browserName).toBeUndefined();
    expect(d.osName).toBeUndefined();
    expect(d.deviceType).toBe('desktop');
    expect(d.fingerprint).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('parseDevice - fingerprint', () => {
  it('is a stable 32-char hex hash, deterministic for identical inputs', () => {
    const a = parseDevice(CHROME_WIN, { timezone: 'Asia/Kolkata', screen: '1920x1080' });
    const b = parseDevice(CHROME_WIN, { timezone: 'Asia/Kolkata', screen: '1920x1080' });
    expect(a.fingerprint).toMatch(/^[0-9a-f]{32}$/);
    expect(a.fingerprint).toBe(b.fingerprint);
  });

  it('changes when any client hint changes (the anti-fraud signal)', () => {
    const base = parseDevice(CHROME_WIN, { timezone: 'Asia/Kolkata' });
    const movedTz = parseDevice(CHROME_WIN, { timezone: 'America/New_York' });
    expect(base.fingerprint).not.toBe(movedTz.fingerprint);
  });
});
