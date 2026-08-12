import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry } from '@/lib/money';

function parseLocation(location: unknown): { lat: number; lng: number } | null {
  if (!location) return null;
  const match = String(location).match(/POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = (await createClient()) as any;

    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select(
        `id,
         business_id,
         cuisine_type,
         preparation_time,
         delivery_radius_km,
         minimum_order,
         service_hours,
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
      )
      .eq('id', id)
      .single();

    if (restError || !restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 },
      );
    }

    const business = restaurant.businesses;
    const location = parseLocation(business.location);
    const address = (business.address as Record<string, unknown> | null) ?? {};
    const formatted = String(address.formatted ?? business.name);
    const metadata = (business.metadata as Record<string, unknown> | null) ?? {};
    const currency =
      (business.countries as { currency_code?: string }[] | null)?.[0]?.currency_code ??
      getCurrencyForCountry(business.country_code);

    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('id, name, description, sort_order, is_available')
        .eq('restaurant_id', id)
        .eq('is_available', true)
        .order('sort_order'),
      supabase
        .from('menu_items')
        .select(
          'id, category_id, restaurant_id, name, description, price, currency, image, ingredients, allergens, preparation_time, is_available, modifiers',
        )
        .eq('restaurant_id', id)
        .eq('is_available', true)
        .order('name'),
    ]);

    if (categoriesResult.error || itemsResult.error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch menu' },
        { status: 500 },
      );
    }

    const itemsByCategory = new Map<string, any[]>();
    for (const item of itemsResult.data ?? []) {
      const list = itemsByCategory.get(item.category_id) ?? [];
      list.push({
        id: item.id,
        businessId: business.id,
        categoryId: item.category_id,
        restaurantId: item.restaurant_id,
        name: item.name,
        description: item.description ?? '',
        price: Number(item.price),
        currencyCode: item.currency ?? currency,
        image: item.image ?? '',
        ingredients: item.ingredients ?? [],
        allergens: item.allergens ?? [],
        available: item.is_available === true,
        preparationTime: item.preparation_time ?? restaurant.preparation_time ?? 15,
        modifiers: item.modifiers ?? [],
      });
      itemsByCategory.set(item.category_id, list);
    }

    const menu = (categoriesResult.data ?? []).map((category: any) => ({
      id: category.id,
      businessId: business.id,
      name: category.name,
      description: category.description ?? '',
      sortOrder: category.sort_order ?? 0,
      items: itemsByCategory.get(category.id) ?? [],
    }));

    const deliveryFee = Number(metadata.delivery_fee ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          businessId: business.id,
          name: business.name,
          description: business.description ?? '',
          cuisineType: restaurant.cuisine_type ?? 'African',
          rating: Number(business.rating ?? 0),
          preparationTime: Number(restaurant.preparation_time ?? 15),
          deliveryRadiusKm: Number(restaurant.delivery_radius_km ?? 0),
          minimumOrder: Number(restaurant.minimum_order ?? 0),
          deliveryFee,
          currency,
          countryCode: business.country_code,
          location,
          address: formatted,
          serviceHours: restaurant.service_hours ?? {},
        },
        menu,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
