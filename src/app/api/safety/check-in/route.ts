import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDriverCheckIn } from '@/lib/pickup/safety-manager';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { checkInType, lat, lng, locationAddress, photoUrl } = body;

  if (!checkInType) {
    return NextResponse.json({ error: 'Missing checkInType' }, { status: 400 });
  }

  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('userId', user.id)
    .single() as unknown as { data: { id: string } | null };

  if (!driver) {
    return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
  }

  const checkIn = await createDriverCheckIn({
    driverId: driver.id,
    checkInType,
    location: lat !== undefined ? { lat, lng: lng ?? lat } : undefined,
    locationAddress,
    photoUrl,
  });

  if (!checkIn) {
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 });
  }

  return NextResponse.json(checkIn, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('userId', user.id)
    .single() as unknown as { data: { id: string } | null };

  if (!driver) {
    return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  const { data } = await supabase
    .from('driver_check_ins')
    .select('*')
    .eq('driver_id', driver.id)
    .order('checked_in_at', { ascending: false })
    .limit(limit);

  return NextResponse.json(data ?? []);
}
