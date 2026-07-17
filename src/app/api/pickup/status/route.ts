import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPickupOrderByOrderId, getCustomerPickups, getVendorPickups } from '@/lib/pickup/pickup-manager';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const businessId = searchParams.get('businessId');
  const status = searchParams.get('status');

  if (orderId) {
    const pickup = await getPickupOrderByOrderId(orderId);
    if (!pickup) {
      return NextResponse.json({ error: 'Pickup order not found' }, { status: 404 });
    }
    return NextResponse.json(pickup);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role === 'vendor' || businessId) {
    const vendorBusinessId = businessId;
    if (!vendorBusinessId) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('id')
        .eq('ownerId', user.id)
        .single() as unknown as { data: { id: string } | null };
      if (!biz) {
        return NextResponse.json({ error: 'No business found' }, { status: 404 });
      }
      const pickups = await getVendorPickups(biz.id, status as any);
      return NextResponse.json(pickups);
    }
    const pickups = await getVendorPickups(vendorBusinessId, status as any);
    return NextResponse.json(pickups);
  }

  const pickups = await getCustomerPickups(user.id);
  return NextResponse.json(pickups);
}
