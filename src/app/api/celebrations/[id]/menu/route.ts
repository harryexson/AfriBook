import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const admin = createAdminClient() as any;

const MENU_CATEGORIES = ['starter', 'main', 'dessert', 'drink', 'snack', 'other'];

async function assertOrganizer(userId: string, eventId: string): Promise<void> {
  const { data: evt } = await admin
    .from('events')
    .select('id, organizer_id, celebration_type, allow_menu_choice')
    .eq('id', eventId)
    .single();

  if (!evt || evt.celebration_type == null) {
    throw Object.assign(new Error('Not found: not a celebration'), { status: 404 });
  }
  if (evt.organizer_id !== userId) {
    throw Object.assign(new Error('Forbidden: only the organizer can manage the menu'), {
      status: 403,
    });
  }
  if (!evt.allow_menu_choice) {
    throw Object.assign(new Error('Menu choice is disabled for this celebration'), { status: 400 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();
    await assertOrganizer(user.id, eventId);

    const { data: items } = await admin
      .from('celebration_menu_items')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    return NextResponse.json({ success: true, data: { items: items ?? [] } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();
    await assertOrganizer(user.id, eventId);

    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: items[]' },
        { status: 400 },
      );
    }

    const rows = items.map((item: Record<string, unknown>, index: number) => {
      const category = (item.category as string) ?? 'other';
      if (!MENU_CATEGORIES.includes(category)) {
        throw Object.assign(
          new Error(`Invalid category "${category}". Must be one of: ${MENU_CATEGORIES.join(', ')}`),
          { status: 400 },
        );
      }
      if (!item.name || typeof item.name !== 'string') {
        throw Object.assign(new Error('Each menu item requires a name'), { status: 400 });
      }
      return {
        event_id: eventId,
        name: item.name,
        category,
        description: typeof item.description === 'string' ? item.description : '',
        is_vegetarian: Boolean(item.isVegetarian),
        is_vegan: Boolean(item.isVegan),
        is_halal: Boolean(item.isHalal),
        is_kosher: Boolean(item.isKosher),
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
        price: typeof item.price === 'number' ? item.price : null,
        is_active: item.isActive !== false,
        sort_order: typeof item.sortOrder === 'number' ? item.sortOrder : index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { data: created, error } = await admin
      .from('celebration_menu_items')
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create menu items' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { items: created ?? [], count: created?.length ?? 0 },
        message: `${created?.length ?? 0} menu item(s) added`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 },
    );
  }
}
