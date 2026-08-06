import { NextRequest, NextResponse } from 'next/server';

async function getDb() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient() as any;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getDb();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { type, requestId } = body;

    if (!type || !requestId) {
      return NextResponse.json(
        { success: false, error: 'type and requestId are required' },
        { status: 400 },
      );
    }

    if (!['ride', 'delivery', 'food_delivery'].includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid dispatch type: ${type}` },
        { status: 400 },
      );
    }

    if (type === 'ride') {
      const { error } = await supabase.rpc('ridely_dispatch' as never, {
        p_ride_id: requestId,
      } as never);
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 },
        );
      }
    } else {
      const table = type === 'food_delivery' ? 'ridely_food_deliveries' : 'ridely_deliveries';
      const { error } = await supabase.rpc('ridely_dispatch_delivery' as never, {
        p_delivery_id: requestId,
        p_table: table,
      } as never);
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({ success: true, data: { dispatched: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
