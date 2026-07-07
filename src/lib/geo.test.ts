import { describe, it, expect } from 'vitest';
import { haversineKm, impliedSpeedKmh } from './geo';

describe('haversineKm', () => {
  it('returns null when any coordinate is missing or null', () => {
    expect(haversineKm({ latitude: 1, longitude: 1 }, { latitude: 2, longitude: null })).toBeNull();
    expect(haversineKm({ latitude: null, longitude: 1 }, { latitude: 2, longitude: 2 })).toBeNull();
    expect(haversineKm({ latitude: 1 }, { latitude: 2, longitude: 2 })).toBeNull();
    // undefined coords also yield null (not a bogus 0)
    expect(haversineKm({}, {})).toBeNull();
  });

  it('is zero for identical points', () => {
    expect(haversineKm({ latitude: 22.57, longitude: 88.36 }, { latitude: 22.57, longitude: 88.36 })).toBe(0);
  });

  it('is ~111.19 km for one degree of longitude at the equator', () => {
    const d = haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    expect(d).not.toBeNull();
    expect(d as number).toBeCloseTo(111.19, 1);
  });

  it('computes a realistic Kolkata->Delhi distance (~1300 km)', () => {
    const d = haversineKm(
      { latitude: 22.5726, longitude: 88.3639 },
      { latitude: 28.6139, longitude: 77.209 },
    ) as number;
    expect(d).toBeGreaterThan(1250);
    expect(d).toBeLessThan(1350);
  });

  it('is symmetric', () => {
    const a = { latitude: 12.9716, longitude: 77.5946 };
    const b = { latitude: 19.076, longitude: 72.8777 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a) as number, 6);
  });
});

describe('impliedSpeedKmh (impossible-travel signal)', () => {
  it('divides distance by elapsed hours', () => {
    // 100 km over 1 hour => 100 km/h
    expect(impliedSpeedKmh(100, 3_600_000)).toBeCloseTo(100, 6);
    // 1000 km over 30 minutes => 2000 km/h (physically impossible)
    expect(impliedSpeedKmh(1000, 1_800_000)).toBeCloseTo(2000, 6);
  });

  it('returns Infinity for zero or negative elapsed time (guards divide-by-zero)', () => {
    expect(impliedSpeedKmh(50, 0)).toBe(Infinity);
    expect(impliedSpeedKmh(50, -1000)).toBe(Infinity);
  });
});
