import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/neon/server';

// Real `menu_items` schema (verified against Neon): id, category_id (uuid
// FK, NOT a free-text category name), restaurant_id, name, description,
// price, currency, image (not image_url), ingredients, allergens,
// preparation_time (not prep_time_min), is_available (not available),
// modifiers, metadata. There is no `complexity`, `created_at`, or
// `updated_at` column on this table — those fields from the original
// Supabase code were being silently dropped/erroring.
interface MenuItemRow {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  image: string | null;
  is_available: boolean;
  preparation_time: number | null;
  modifiers: unknown;
  metadata: unknown;
}

async function ownsRestaurant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantId: string,
  userId: string,
): Promise<boolean> {
  // NOTE: original code checked a nonexistent `restaurant_configs` table
  // filtered by `business_id = user.id` — a pre-existing bug that made
  // ownership checks fail (403) for every non-admin caller. Real ownership
  // chain is restaurants.business_id -> businesses.owner_id.
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('business_id')
    .eq('id', restaurantId)
    .single() as unknown as { data: { business_id: string } | null };

  if (!restaurant?.business_id) return false;

  const { data: owns } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', restaurant.business_id)
    .eq('owner_id', userId)
    .single() as unknown as { data: { id: string } | null };

  return !!owns;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurantId');
  // NOTE: `category` here is treated as a category_id (uuid) — the real
  // column is a FK, not a free-text name. Pre-existing mismatch, flagged
  // rather than resolved (would need a category-name lookup).
  const category = searchParams.get('category');
  const availableOnly = searchParams.get('available') === 'true';

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
  }

  let query = supabase
    .from('menu_items' as never)
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('category_id', { ascending: true })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category_id', category);
  }
  if (availableOnly) {
    query = query.eq('is_available', true);
  }

  const { data, error } = await query as unknown as {
    data: MenuItemRow[] | null;
    error: { message: string } | null;
  };

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    restaurantId?: string;
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    imageUrl?: string;
    available?: boolean;
    prepTimeMin?: number;
    complexity?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    restaurantId,
    name,
    price,
    category,
    description,
    imageUrl,
    available,
    prepTimeMin,
  } = body;

  if (!restaurantId || !name || price === undefined || !category) {
    return NextResponse.json(
      { error: 'Missing required fields: restaurantId, name, price, category' },
      { status: 400 },
    );
  }

  if (price < 0) {
    return NextResponse.json({ error: 'Price must be non-negative' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    if (!(await ownsRestaurant(supabase, restaurantId, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // `complexity` has no backing column on menu_items — dropped (was being
  // silently rejected/erroring before too). `category` maps to category_id
  // (uuid FK) — see GET's note; the caller is expected to already pass a
  // valid category_id.
  const { data, error } = await supabase
    .from('menu_items' as never)
    .insert({
      restaurant_id: restaurantId,
      name,
      description: description ?? null,
      price,
      category_id: category,
      image: imageUrl ?? null,
      is_available: available ?? true,
      preparation_time: prepTimeMin ?? 10,
    } as never)
    .select()
    .single() as unknown as {
    data: MenuItemRow | null;
    error: { message: string } | null;
  };

  if (error) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    id?: string;
    restaurantId?: string;
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    imageUrl?: string;
    available?: boolean;
    prepTimeMin?: number;
    complexity?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, restaurantId, ...updates } = body;

  if (!id || !restaurantId) {
    return NextResponse.json(
      { error: 'id and restaurantId are required' },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    if (!(await ownsRestaurant(supabase, restaurantId, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.price !== undefined) {
    if (updates.price < 0) {
      return NextResponse.json({ error: 'Price must be non-negative' }, { status: 400 });
    }
    updateData.price = updates.price;
  }
  if (updates.category !== undefined) updateData.category_id = updates.category;
  if (updates.imageUrl !== undefined) updateData.image = updates.imageUrl;
  if (updates.available !== undefined) updateData.is_available = updates.available;
  if (updates.prepTimeMin !== undefined) updateData.preparation_time = updates.prepTimeMin;
  // `complexity` has no backing column — dropped.

  const { data, error } = await supabase
    .from('menu_items' as never)
    .update(updateData as never)
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .select()
    .single() as unknown as {
    data: MenuItemRow | null;
    error: { message: string } | null;
  };

  if (error) {
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const restaurantId = searchParams.get('restaurantId');

  if (!id || !restaurantId) {
    return NextResponse.json(
      { error: 'id and restaurantId query params are required' },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    if (!(await ownsRestaurant(supabase, restaurantId, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from('menu_items' as never)
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurantId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
