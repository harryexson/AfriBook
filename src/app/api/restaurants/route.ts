import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry } from '@/lib/money';
import { getMockRestaurants, type MockRestaurant } from '@/lib/restaurants/data';

function parseLocation(location: unknown): { lat: number; lng: number } | null {
  if (!location) return null;
  const match = String(location).match(/POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/);
  if (!match) return null;
  return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
}

function deliveryFeeFromMetadata(metadata: Record<string, unknown> | null): number {
  if (!metadata) return 0;
  const fee = Number(metadata.delivery_fee ?? 0);
  return Number.isFinite(fee) ? fee : 0;
}

function matchesCity(restaurant: { address: string; city?: string; name: string }, city: string): boolean {
  const needle = city.toLowerCase();
  if (restaurant.city && restaurant.city.toLowerCase() === needle) return true;
  return (
    restaurant.address.toLowerCase().includes(needle) ||
    restaurant.name.toLowerCase().includes(needle)
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() ?? '';
    const cuisine = searchParams.get('cuisine')?.trim() ?? '';
    const country = searchParams.get('country')?.trim().toUpperCase() ?? '';
    const city = searchParams.get('city')?.trim() ?? '';

    let query = supabase
      .from('restaurants')
      .select(
        `id,
         business_id,
         cuisine_type,
         preparation_time,
         delivery_radius_km,
         minimum_order,
         businesses!inner(
           id,
           name,
           description,
           country_code,
           status,
           rating,
           location,
           address,
           hours,
           metadata,
           countries(currency_code)
         )`,
      );

    if (cuisine) query = query.eq('cuisine_type', cuisine);
    if (search) query = query.ilike('businesses.name', `%${search}%`);

    const { data, error } = await query;

    let restaurants: any[] = [];

    if (!error && Array.isArray(data)) {
      restaurants = data.map((row: any) => {
        const business = row.businesses;
        const location = parseLocation(business.location);
        const address = (business.address as Record<string, unknown> | null) ?? {};
        const formatted = String(address.formatted ?? business.name);
        const currency =
          (business.countries as { currency_code?: string }[] | null)?.[0]?.currency_code ??
          getCurrencyForCountry(business.country_code);

        return {
          id: row.id,
          businessId: business.id,
          name: business.name,
          description: business.description ?? '',
          cuisineType: row.cuisine_type ?? 'African',
          rating: Number(business.rating ?? 0),
          preparationTime: Number(row.preparation_time ?? 15),
          deliveryRadiusKm: Number(row.delivery_radius_km ?? 0),
          minimumOrder: Number(row.minimum_order ?? 0),
          deliveryFee: deliveryFeeFromMetadata(business.metadata as Record<string, unknown> | null),
          currency,
          countryCode: business.country_code,
          location,
          address: formatted,
        };
      });
    }

    if (search) {
      const q = search.toLowerCase();
      restaurants = restaurants.filter(
        (r: any) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisineType.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q),
      );
    }
    if (country) {
      restaurants = restaurants.filter((r: any) => r.countryCode === country);
    }
    if (city) {
      restaurants = restaurants.filter((r: any) => matchesCity(r, city));
    }

    // Deterministic mock fallback (same strategy as /api/stays) so every
    // destination resolves to location-aware results even when Supabase is
    // unavailable or a market has no seeded restaurants yet.
    if (restaurants.length === 0) {
      const fallbackCountry = country || 'NG';
      const mock: MockRestaurant[] = getMockRestaurants(fallbackCountry);
      let fallback = mock.filter((r) => !city || matchesCity(r, city));
      if (search) {
        const q = search.toLowerCase();
        fallback = fallback.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.cuisineType.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q),
        );
      }
      restaurants = fallback.map((r) => ({
        id: r.id,
        businessId: r.businessId,
        name: r.name,
        description: r.description,
        cuisineType: r.cuisineType,
        rating: r.rating,
        preparationTime: r.preparationTime,
        deliveryRadiusKm: r.deliveryRadiusKm,
        minimumOrder: r.minimumOrder,
        deliveryFee: r.deliveryFee,
        currency: r.currency,
        countryCode: r.countryCode,
        location: r.location,
        address: r.address,
      }));
    }

    restaurants.sort((a: any, b: any) => b.rating - a.rating);

    return NextResponse.json({ success: true, data: { restaurants } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}