import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser(); const kind = req.nextUrl.searchParams.get('kind') || 'bookings';
    const definitions: Record<string, { table: string; fields: string; owner: string }> = {
      bookings: { table: 'bookings', fields: 'id,status,start_time,end_time,amount,currency,payment_status,created_at', owner: 'customer_id' },
      orders: { table: 'orders', fields: 'id,status,total,currency,payment_status,created_at', owner: 'customer_id' },
      deliveries: { table: 'ridely_deliveries', fields: 'id,status,pickup_address,destination_address,created_at', owner: 'customer_id' },
      notifications: { table: 'notifications', fields: 'id,title,body,created_at', owner: 'user_id' },
    };
    const d = definitions[kind]; if (!d) return NextResponse.json({ error: 'Unknown activity type' }, { status: 400 });
    const { data, error } = await supabase.from(d.table).select(d.fields).eq(d.owner, user.id).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ data: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const status = (err as { status?: number }).status === 401 ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Sign in to see your activity' : 'Could not load your activity' }, { status });
  }
}
