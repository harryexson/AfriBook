import { describe, it, expect } from 'vitest';
import {
  COUNTRY_PRICING,
  DEFAULT_PRICING,
  getRidePricingForCountry,
  getRideTypeMultiplier,
  estimateRideFare,
} from '@/lib/ridely/ride-pricing';

describe('getRidePricingForCountry — per-country fare tables', () => {
  it('resolves known markets to their local fare table', () => {
    expect(getRidePricingForCountry('NG').baseFare).toBe(500);
    expect(getRidePricingForCountry('KE').baseFare).toBe(100);
    expect(getRidePricingForCountry('US').baseFare).toBe(2.5);
    expect(getRidePricingForCountry('ZA').minimumFare).toBe(30);
  });

  it('falls back to the neutral default for unknown markets', () => {
    expect(getRidePricingForCountry('XX')).toEqual(DEFAULT_PRICING);
  });

  it('is case-insensitive', () => {
    expect(getRidePricingForCountry('ng')).toEqual(COUNTRY_PRICING.NG);
    expect(getRidePricingForCountry('ke')).toEqual(COUNTRY_PRICING.KE);
  });
});

describe('getRideTypeMultiplier — type vs economy proportions', () => {
  it('economy is 1 and premium is greater than economy', () => {
    expect(getRideTypeMultiplier('economy')).toBe(1);
    expect(getRideTypeMultiplier('premium')).toBeGreaterThan(1);
  });

  it('is derived from relative base fares only', () => {
    const base = getRideTypeMultiplier('economy');
    const premium = getRideTypeMultiplier('premium');
    const comfort = getRideTypeMultiplier('comfort');
    expect(base).toBe(1);
    expect(premium).toBeGreaterThan(comfort);
  });
});

describe('estimateRideFare — local-currency estimates', () => {
  it('applies per-country pricing, never the NGN table for other markets', () => {
    const ng = estimateRideFare('economy', 10, 20, 'NG');
    const ke = estimateRideFare('economy', 10, 20, 'KE');
    const us = estimateRideFare('economy', 10, 20, 'US');

    expect(ng.currencyCode).toBe('NGN');
    expect(ke.currencyCode).toBe('KES');
    expect(us.currencyCode).toBe('USD');

    // A 10km ride in Kenya must never be priced in Nigerian Naira scale.
    expect(ke.estimatedFare).toBeLessThan(ng.estimatedFare);
    // USD baseline is fractional vs NGN-scale.
    expect(us.estimatedFare).toBeLessThan(ng.estimatedFare);
  });

  it('respects the minimum fare floor', () => {
    const ng = estimateRideFare('economy', 0.5, 1, 'NG');
    expect(ng.estimatedFare).toBeGreaterThanOrEqual(ng.minimumFare);
  });

  it('applies surge multipliers above 1', () => {
    const base = estimateRideFare('economy', 10, 20, 'NG', 1);
    const surged = estimateRideFare('economy', 10, 20, 'NG', 1.5);
    expect(surged.estimatedFare).toBeGreaterThan(base.estimatedFare);
  });

  it('ignores surge multipliers below 1', () => {
    const normal = estimateRideFare('economy', 10, 20, 'NG', 1);
    const discounted = estimateRideFare('economy', 10, 20, 'NG', 0.5);
    expect(discounted.estimatedFare).toBe(normal.estimatedFare);
  });

  it('returns consistent fare components for premium types', () => {
    const premium = estimateRideFare('premium', 10, 20, 'NG');
    const economy = estimateRideFare('economy', 10, 20, 'NG');
    expect(premium.baseFare).toBeGreaterThan(economy.baseFare);
    expect(premium.perKmRate).toBeGreaterThan(economy.perKmRate);
  });
});
