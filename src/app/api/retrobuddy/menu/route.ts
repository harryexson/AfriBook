import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface MenuItemRow {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
  prep_time_min: number;
  complexity: string;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurantId');
  const category = searchParams.get('category');
  const availableOnly = searchParams.get('available') === 'true';

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
  }

  let query = supabase
    .from('menu_items' as never)
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }
  if (availableOnly) {
    query = query.eq('available', true);
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
    complexity,
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
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    const { data: owns } = await supabase
      .from('restaurant_configs' as never)
      .select('id')
      .eq('id', restaurantId)
      .eq('business_id', user.id)
      .single() as unknown as { data: { id: string } | null };

    if (!owns) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('menu_items' as never)
    .insert({
      restaurant_id: restaurantId,
      name,
      description: description ?? null,
      price,
      category,
      image_url: imageUrl ?? null,
      available: available ?? true,
      prep_time_min: prepTimeMin ?? 10,
      complexity: complexity ?? 'moderate',
      created_at: now,
      updated_at: now,
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
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    const { data: owns } = await supabase
      .from('restaurant_configs' as never)
      .select('id')
      .eq('id', restaurantId)
      .eq('business_id', user.id)
      .single() as unknown as { data: { id: string } | null };

    if (!owns) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.price !== undefined) {
    if (updates.price < 0) {
      return NextResponse.json({ error: 'Price must be non-negative' }, { status: 400 });
    }
    updateData.price = updates.price;
  }
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
  if (updates.available !== undefined) updateData.available = updates.available;
  if (updates.prepTimeMin !== undefined) updateData.prep_time_min = updates.prepTimeMin;
  if (updates.complexity !== undefined) updateData.complexity = updates.complexity;

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
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    const { data: owns } = await supabase
      .from('restaurant_configs' as never)
      .select('id')
      .eq('id', restaurantId)
      .eq('business_id', user.id)
      .single() as unknown as { data: { id: string } | null };

    if (!owns) {
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
