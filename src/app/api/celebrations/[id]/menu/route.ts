import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';

const MENU_CATEGORIES = ['starter', 'main', 'dessert', 'drink', 'snack', 'other'];

async function assertOrganizer(userId: string, eventId: string): Promise<void> {
  const rows = await query<{
    id: string;
    organizer_id: string;
    celebration_type: string | null;
    allow_menu_choice: boolean | null;
  }>(
    `SELECT id, organizer_id, celebration_type, allow_menu_choice FROM events WHERE id = $1 LIMIT 1`,
    [eventId],
  );
  const evt = rows[0] ?? null;

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

    const items = await query(
      `SELECT * FROM celebration_menu_items WHERE event_id = $1 ORDER BY sort_order ASC`,
      [eventId],
    );

    return NextResponse.json({ success: true, data: { items } });
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

    const columns = [
      'event_id',
      'name',
      'category',
      'description',
      'is_vegetarian',
      'is_vegan',
      'is_halal',
      'is_kosher',
      'allergens',
      'price',
      'is_active',
      'sort_order',
      'created_at',
      'updated_at',
    ];
    const values: unknown[] = [];
    const valuePlaceholders = rows.map((row, rowIndex) => {
      const placeholders = columns.map((col, colIndex) => {
        const value = (row as Record<string, unknown>)[col];
        values.push(col === 'allergens' ? JSON.stringify(value) : value);
        return `$${rowIndex * columns.length + colIndex + 1}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    let created: unknown[] = [];
    try {
      created = await query(
        `INSERT INTO celebration_menu_items (${columns.join(', ')})
         VALUES ${valuePlaceholders.join(', ')}
         RETURNING *`,
        values,
      );
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to create menu items' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { items: created, count: created.length },
        message: `${created.length} menu item(s) added`,
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
