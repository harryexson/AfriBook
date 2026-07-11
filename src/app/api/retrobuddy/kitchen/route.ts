import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getKitchenQueue,
  addToKitchenDisplay,
  updateKitchenItemStatus,
  assignToStaff,
  getKitchenStats,
  reorderQueue,
} from '@/lib/retrobuddy/kitchen-display';
import type { KitchenDisplayPriority } from '@/lib/retrobuddy/types';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurantId');
  const includeStats = searchParams.get('stats') === 'true';

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
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

  try {
    const queue = await getKitchenQueue(restaurantId);

    if (includeStats) {
      const stats = await getKitchenStats(restaurantId);
      return NextResponse.json({ queue, stats });
    }

    return NextResponse.json({ queue });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    action?: 'add' | 'update_status';
    orderId?: string;
    itemId?: string;
    priority?: KitchenDisplayPriority;
    status?: 'pending' | 'in_progress' | 'ready';
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action } = body;

  if (action === 'add') {
    if (!body.orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    try {
      const item = await addToKitchenDisplay(body.orderId, body.priority ?? 'normal');
      return NextResponse.json(item, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to kitchen';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === 'update_status') {
    if (!body.itemId || !body.status) {
      return NextResponse.json(
        { error: 'itemId and status are required' },
        { status: 400 },
      );
    }

    const validStatuses = ['pending', 'in_progress', 'ready'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    try {
      const item = await updateKitchenItemStatus(body.itemId, body.status);
      return NextResponse.json(item);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: 'Invalid action. Must be "add" or "update_status"' },
    { status: 400 },
  );
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    action?: 'assign' | 'reorder';
    restaurantId?: string;
    itemId?: string;
    staffId?: string;
    newOrder?: { itemId: string; newPosition: number }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action } = body;

  if (action === 'assign') {
    if (!body.itemId || !body.staffId) {
      return NextResponse.json(
        { error: 'itemId and staffId are required' },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as unknown as { data: { role: string } | null };

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin' && profile?.role !== 'vendor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const item = await assignToStaff(body.itemId, body.staffId);
      return NextResponse.json(item);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === 'reorder') {
    if (!body.restaurantId || !body.newOrder?.length) {
      return NextResponse.json(
        { error: 'restaurantId and newOrder are required' },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as unknown as { data: { role: string } | null };

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin' && profile?.role !== 'vendor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      await reorderQueue(body.restaurantId, body.newOrder);
      return NextResponse.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: 'Invalid action. Must be "assign" or "reorder"' },
    { status: 400 },
  );
}
