import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { driverId } = body;

    if (!id || !driverId) {
      return NextResponse.json(
        { success: false, error: 'Ride ID and driverId are required' },
        { status: 400 },
      );
    }

    const { data: ride, error: fetchError } = await supabase
      .from('ridely_rides')
      .select('status, rider_id, ride_type, pickup_lat, pickup_lng, destination_lat, destination_lng, pricing')
      .eq('id', id)
      .single();

    if (fetchError || !ride) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 },
      );
    }

    if (ride.status !== 'searching' && ride.status !== 'requesting') {
      return NextResponse.json(
        { success: false, error: `Ride cannot be accepted in "${ride.status}" status` },
        { status: 400 },
      );
    }

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, user_id, name, phone, avatar_url, vehicle_type, vehicle_make, vehicle_model, vehicle_color, rating, total_trips, status')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 },
      );
    }

    if (driver.status !== 'available') {
      return NextResponse.json(
        { success: false, error: 'Driver is not available' },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from('ridely_rides')
      .update({
        driver_id: driverId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to accept ride' },
        { status: 500 },
      );
    }

    await supabase
      .from('drivers')
      .update({ status: 'on_trip', current_trip_id: id })
      .eq('id', driverId);

    await supabase.from('notifications').insert({
      user_id: ride.rider_id,
      type: 'system',
      title: 'Driver Found!',
      body: `${driver.name} has accepted your ride. Vehicle: ${driver.vehicle_color} ${driver.vehicle_make} ${driver.vehicle_model}.`,
      data: {
        ride_id: id,
        driver_id: driverId,
        driver_name: driver.name,
        vehicle: `${driver.vehicle_color} ${driver.vehicle_make} ${driver.vehicle_model}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        rideId: id,
        status: 'accepted',
        driver: {
          id: driver.id,
          userId: driver.user_id,
          name: driver.name,
          phone: driver.phone,
          avatarUrl: driver.avatar_url,
          vehicleType: driver.vehicle_type,
          vehicleMake: driver.vehicle_make,
          vehicleModel: driver.vehicle_model,
          vehicleColor: driver.vehicle_color,
          rating: driver.rating,
          totalTrips: driver.total_trips,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
