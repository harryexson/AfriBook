import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleSOSAlert } from '@/lib/pickup/safety-manager';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { lat, lng, rideId, deliveryId, description } = body;

  if (lat === undefined || lng === undefined) {
    return NextResponse.json({ error: 'Location required' }, { status: 400 });
  }

  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('userId', user.id)
    .single() as unknown as { data: { id: string } | null };

  if (!driver) {
    return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
  }

  const result = await handleSOSAlert({
    driverId: driver.id,
    location: { lat, lng },
    rideId,
    deliveryId,
    description,
  });

  return NextResponse.json(result);
}
