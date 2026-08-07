import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient() as any;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ride ID is required' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const rating = body?.rating;
    const review = typeof body?.review === 'string' ? body.review : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'rating must be an integer between 1 and 5' },
        { status: 400 },
      );
    }

    const { data: ride, error: rideError } = await supabase
      .from('ridely_rides')
      .select('id, rider_id, driver_id, status')
      .eq('id', id)
      .single();

    if (rideError || !ride) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 },
      );
    }

    if (ride.rider_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the ride rider can rate this ride' },
        { status: 403 },
      );
    }

    if (ride.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot rate a ride that is not completed' },
        { status: 400 },
      );
    }

    const payload = {
      ride_id: id,
      rider_id: user.id,
      driver_id: ride.driver_id ?? null,
      rating,
      review,
    };

    const { data: existing } = await supabase
      .from('ridely_ride_ratings')
      .select('id')
      .eq('ride_id', id)
      .maybeSingle();

    let result;
    let error;
    if (existing) {
      const { data, error: updateError } = await supabase
        .from('ridely_ride_ratings')
        .update({ rating, review })
        .eq('id', existing.id)
        .select()
        .single();
      result = data;
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('ridely_ride_ratings')
        .insert(payload)
        .select()
        .single();
      result = data;
      error = insertError;
    }

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to save ride rating' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
