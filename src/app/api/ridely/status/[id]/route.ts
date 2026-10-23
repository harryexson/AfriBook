import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, createClient } from '@/lib/neon/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') ?? 'ride';

  await requireAuthenticatedUser();

  const db = await createClient();

  if (type === 'delivery') {
    const { data, error } = await (db.from('ridely_deliveries') as any)
      .select('id, status, driver_id, estimated_arrival, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ type: 'delivery', ...data });
  }

  if (type === 'food') {
    const { data, error } = await (db.from('food_orders') as any)
      .select('id, status, driver_id, estimated_delivery_time, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ type: 'food', ...data });
  }

  const { data, error } = await (db.from('ridely_rides') as any)
    .select('id, status, driver_id, estimated_arrival, updated_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ type: 'ride', ...data });
}
