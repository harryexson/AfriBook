// ─── Admin Analytics Service ──────────────────────────────────
// Real platform-wide aggregation, replacing the fully-mocked numbers in
// admin/page.tsx, admin/analytics/page.tsx, admin/promotions/page.tsx, and
// admin/promotions/ads/page.tsx. Follows the same shape as
// src/lib/vendor/analytics.ts (real queries, currency resolved explicitly,
// nothing silently summed across incompatible currencies).
//
// The one genuine data-correctness issue fixed here, not just wiring: the
// original mock admin/page.tsx summed each country's volume as if they
// were all the same currency. Real cross-country totals here are actually
// converted to USD per-row via convertCurrency before summing — a sum of
// raw local-currency numbers across countries is meaningless, not just
// mislabeled.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry, convertCurrency } from '@/lib/money';

export interface CountryVolumeRow {
  code: string;
  name: string;
  users: number;
  businesses: number;
  volumeLocal: number;
  currencyCode: string;
  volumeUSD: number;
}

export interface PlatformOverview {
  totalUsers: number;
  totalBusinesses: number;
  totalVolumeUSD: number;
  byCountry: CountryVolumeRow[];
}

/**
 * Platform-wide totals. Volume = bookings + orders across every business,
 * each converted from that business's own country currency into USD
 * before being added to any total — never summed as raw numbers first.
 */
export async function getPlatformOverview(): Promise<PlatformOverview> {
  const supabase = await createClient();

  const [{ count: totalUsers }, { data: businesses }] = await Promise.all([
    (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }),
    (supabase.from('businesses') as any).select('id, country_code'),
  ]);

  const businessRows = (businesses ?? []) as { id: string; country_code: string }[];
  const businessIds = businessRows.map((b) => b.id);

  const [{ data: bookingRows }, { data: orderRows }] = await Promise.all([
    businessIds.length
      ? (supabase.from('bookings') as any).select('business_id, amount').in('business_id', businessIds).neq('status', 'cancelled')
      : { data: [] },
    businessIds.length
      ? (supabase.from('orders') as any).select('business_id, total').in('business_id', businessIds).neq('status', 'cancelled')
      : { data: [] },
  ]);

  // Aggregate revenue per business first (still in that business's local
  // currency), then per country, converting to USD once per country.
  const revenueByBusiness = new Map<string, number>();
  for (const b of (bookingRows ?? []) as any[]) {
    revenueByBusiness.set(b.business_id, (revenueByBusiness.get(b.business_id) ?? 0) + Number(b.amount ?? 0));
  }
  for (const o of (orderRows ?? []) as any[]) {
    revenueByBusiness.set(o.business_id, (revenueByBusiness.get(o.business_id) ?? 0) + Number(o.total ?? 0));
  }

  const countryAgg = new Map<string, { users: number; businesses: number; volumeLocal: number }>();
  for (const biz of businessRows) {
    const cc = biz.country_code ?? 'US';
    const entry = countryAgg.get(cc) ?? { users: 0, businesses: 0, volumeLocal: 0 };
    entry.businesses += 1;
    entry.volumeLocal += revenueByBusiness.get(biz.id) ?? 0;
    countryAgg.set(cc, entry);
  }

  // User counts per country come from profiles.country_code separately —
  // a user isn't tied to a business.
  const { data: profileCountries } = await (supabase.from('profiles') as any).select('country_code');
  for (const p of (profileCountries ?? []) as any[]) {
    const cc = p.country_code ?? 'US';
    const entry = countryAgg.get(cc) ?? { users: 0, businesses: 0, volumeLocal: 0 };
    entry.users += 1;
    countryAgg.set(cc, entry);
  }

  const byCountry: CountryVolumeRow[] = Array.from(countryAgg.entries())
    .map(([code, agg]) => {
      const currencyCode = getCurrencyForCountry(code);
      const volumeUSD = currencyCode === 'USD' ? agg.volumeLocal : convertCurrency(agg.volumeLocal, currencyCode, 'USD');
      return { code, name: code, users: agg.users, businesses: agg.businesses, volumeLocal: agg.volumeLocal, currencyCode, volumeUSD };
    })
    .sort((a, b) => b.volumeUSD - a.volumeUSD);

  const totalVolumeUSD = byCountry.reduce((sum, c) => sum + c.volumeUSD, 0);

  return {
    totalUsers: totalUsers ?? 0,
    totalBusinesses: businessRows.length,
    totalVolumeUSD,
    byCountry,
  };
}

export interface RevenueTrendPoint {
  date: string;
  revenueUSD: number;
}

export interface TopVendor {
  businessId: string;
  name: string;
  countryCode: string;
  revenueUSD: number;
  bookingCount: number;
}

export interface TopCategory {
  categoryId: string | null;
  name: string;
  revenueUSD: number;
  bookingCount: number;
}

/**
 * Platform-wide revenue trend, cost/profit intentionally omitted — there's
 * no platform-cost tracking anywhere in the schema (checked), so a
 * "profit" figure here would just be revenue minus an invented number.
 * Revenue only, properly converted to USD per business's own country.
 */
export async function getRevenueTrend(days = 30): Promise<RevenueTrendPoint[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86400000);

  const { data: businesses } = await (supabase.from('businesses') as any).select('id, country_code');
  const businessRows = (businesses ?? []) as { id: string; country_code: string }[];
  const currencyByBusiness = new Map(businessRows.map((b) => [b.id, getCurrencyForCountry(b.country_code ?? 'US')]));
  const businessIds = businessRows.map((b) => b.id);

  if (businessIds.length === 0) return [];

  const [{ data: bookingRows }, { data: orderRows }] = await Promise.all([
    (supabase.from('bookings') as any).select('business_id, amount, created_at').in('business_id', businessIds).gte('created_at', since.toISOString()).neq('status', 'cancelled'),
    (supabase.from('orders') as any).select('business_id, total, created_at').in('business_id', businessIds).gte('created_at', since.toISOString()).neq('status', 'cancelled'),
  ]);

  const byDay = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    byDay.set(new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10), 0);
  }

  const addRow = (businessId: string, amount: number, createdAt: string) => {
    const day = String(createdAt).slice(0, 10);
    if (!byDay.has(day)) return;
    const currency = currencyByBusiness.get(businessId) ?? 'USD';
    const usd = currency === 'USD' ? amount : convertCurrency(amount, currency, 'USD');
    byDay.set(day, (byDay.get(day) ?? 0) + usd);
  };

  for (const b of (bookingRows ?? []) as any[]) addRow(b.business_id, Number(b.amount ?? 0), b.created_at);
  for (const o of (orderRows ?? []) as any[]) addRow(o.business_id, Number(o.total ?? 0), o.created_at);

  return Array.from(byDay.entries()).map(([date, revenueUSD]) => ({ date, revenueUSD }));
}

export async function getTopVendors(limit = 10): Promise<TopVendor[]> {
  const supabase = await createClient();
  const { data: businesses } = await (supabase.from('businesses') as any).select('id, name, country_code');
  const businessRows = (businesses ?? []) as { id: string; name: string; country_code: string }[];
  const businessIds = businessRows.map((b) => b.id);
  if (businessIds.length === 0) return [];

  const [{ data: bookingRows }, { data: orderRows }] = await Promise.all([
    (supabase.from('bookings') as any).select('business_id, amount').in('business_id', businessIds).neq('status', 'cancelled'),
    (supabase.from('orders') as any).select('business_id, total').in('business_id', businessIds).neq('status', 'cancelled'),
  ]);

  const agg = new Map<string, { revenueLocal: number; count: number }>();
  for (const b of (bookingRows ?? []) as any[]) {
    const e = agg.get(b.business_id) ?? { revenueLocal: 0, count: 0 };
    e.revenueLocal += Number(b.amount ?? 0);
    e.count += 1;
    agg.set(b.business_id, e);
  }
  for (const o of (orderRows ?? []) as any[]) {
    const e = agg.get(o.business_id) ?? { revenueLocal: 0, count: 0 };
    e.revenueLocal += Number(o.total ?? 0);
    e.count += 1;
    agg.set(o.business_id, e);
  }

  return businessRows
    .map((biz) => {
      const e = agg.get(biz.id) ?? { revenueLocal: 0, count: 0 };
      const currency = getCurrencyForCountry(biz.country_code ?? 'US');
      const revenueUSD = currency === 'USD' ? e.revenueLocal : convertCurrency(e.revenueLocal, currency, 'USD');
      return { businessId: biz.id, name: biz.name, countryCode: biz.country_code, revenueUSD, bookingCount: e.count };
    })
    .sort((a, b) => b.revenueUSD - a.revenueUSD)
    .slice(0, limit);
}

export async function getTopCategories(limit = 10): Promise<TopCategory[]> {
  const supabase = await createClient();
  const [{ data: businesses }, { data: categories }] = await Promise.all([
    (supabase.from('businesses') as any).select('id, category, country_code'),
    (supabase.from('business_categories') as any).select('id, name'),
  ]);
  const businessRows = (businesses ?? []) as { id: string; category: string | null; country_code: string }[];
  const categoryNameById = new Map(((categories ?? []) as any[]).map((c) => [c.id, c.name]));
  const businessIds = businessRows.map((b) => b.id);
  if (businessIds.length === 0) return [];

  const currencyByBusiness = new Map(businessRows.map((b) => [b.id, getCurrencyForCountry(b.country_code ?? 'US')]));
  const categoryByBusiness = new Map(businessRows.map((b) => [b.id, b.category]));

  const [{ data: bookingRows }, { data: orderRows }] = await Promise.all([
    (supabase.from('bookings') as any).select('business_id, amount').in('business_id', businessIds).neq('status', 'cancelled'),
    (supabase.from('orders') as any).select('business_id, total').in('business_id', businessIds).neq('status', 'cancelled'),
  ]);

  const agg = new Map<string | null, { revenueUSD: number; count: number }>();
  const addRow = (businessId: string, amount: number) => {
    const categoryId = categoryByBusiness.get(businessId) ?? null;
    const currency = currencyByBusiness.get(businessId) ?? 'USD';
    const usd = currency === 'USD' ? amount : convertCurrency(amount, currency, 'USD');
    const e = agg.get(categoryId) ?? { revenueUSD: 0, count: 0 };
    e.revenueUSD += usd;
    e.count += 1;
    agg.set(categoryId, e);
  };
  for (const b of (bookingRows ?? []) as any[]) addRow(b.business_id, Number(b.amount ?? 0));
  for (const o of (orderRows ?? []) as any[]) addRow(o.business_id, Number(o.total ?? 0));

  return Array.from(agg.entries())
    .map(([categoryId, e]) => ({
      categoryId,
      name: categoryId ? (categoryNameById.get(categoryId) ?? 'Unknown category') : 'Uncategorized',
      revenueUSD: e.revenueUSD,
      bookingCount: e.count,
    }))
    .sort((a, b) => b.revenueUSD - a.revenueUSD)
    .slice(0, limit);
}

export interface PromoAnalytics {
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  currencyCode: string;
  redemptions: number;
  maxRedemptions: number | null;
  totalDiscountUSD: number;
  isActive: boolean;
  expiresAt: string | null;
}

export async function getPromoAnalytics(): Promise<PromoAnalytics[]> {
  const supabase = await createClient();
  const { data: promos } = await (supabase.from('promo_codes') as any)
    .select('id, code, description, discount_type, discount_value, currency_code, max_redemptions, current_redemptions, is_active, expires_at')
    .order('created_at', { ascending: false });

  const promoRows = (promos ?? []) as any[];
  if (promoRows.length === 0) return [];

  const { data: redemptions } = await (supabase.from('promo_redemptions') as any)
    .select('promo_id, discount_amount, currency_code')
    .in('promo_id', promoRows.map((p) => p.id));

  const discountByPromo = new Map<string, number>();
  for (const r of (redemptions ?? []) as any[]) {
    const usd = (r.currency_code ?? 'USD') === 'USD' ? Number(r.discount_amount ?? 0) : convertCurrency(Number(r.discount_amount ?? 0), r.currency_code, 'USD');
    discountByPromo.set(r.promo_id, (discountByPromo.get(r.promo_id) ?? 0) + usd);
  }

  return promoRows.map((p) => ({
    code: p.code,
    description: p.description,
    discountType: p.discount_type,
    discountValue: Number(p.discount_value),
    currencyCode: p.currency_code ?? 'USD',
    redemptions: p.current_redemptions ?? 0,
    maxRedemptions: p.max_redemptions,
    totalDiscountUSD: discountByPromo.get(p.id) ?? 0,
    isActive: p.is_active,
    expiresAt: p.expires_at,
  }));
}

export interface AdCampaignAnalytics {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  spent: number;
  currencyCode: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // percent
}

export async function getAdCampaignAnalytics(): Promise<AdCampaignAnalytics[]> {
  const supabase = await createClient();
  const { data } = await (supabase.from('ad_campaigns') as any)
    .select('id, name, platform, status, budget, spent, currency_code, impressions, clicks, conversions')
    .order('created_at', { ascending: false });

  return ((data ?? []) as any[]).map((c) => ({
    id: c.id,
    name: c.name,
    platform: c.platform,
    status: c.status,
    budget: Number(c.budget),
    spent: Number(c.spent),
    currencyCode: c.currency_code ?? 'USD',
    impressions: Number(c.impressions ?? 0),
    clicks: Number(c.clicks ?? 0),
    conversions: Number(c.conversions ?? 0),
    ctr: Number(c.impressions ?? 0) > 0 ? Math.round((Number(c.clicks ?? 0) / Number(c.impressions)) * 10000) / 100 : 0,
  }));
}
