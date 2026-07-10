import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    businessId,
    serviceId,
    staffId,
    startTime,
    endTime,
    notes,
  } = body;

  if (!businessId || !serviceId || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: service } = await supabase
    .from('services')
    .select('price, currency_code, name, business_id')
    .eq('id', serviceId)
    .single() as unknown as { data: { price: number; currency_code: string; name: string; business_id: string } | null };

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      business_id: businessId,
      service_id: serviceId,
      customer_id: user.id,
      staff_id: staffId ?? null,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      amount: service.price,
      currency_code: service.currency_code,
      payment_status: 'pending',
      notes: notes ?? null,
    })
    .select()
    .single() as unknown as { data: unknown; error: unknown };

  if (error) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'booking',
    title: 'Booking Created',
    body: `Your booking for ${service.name} has been created.`,
    data: { booking_id: (booking as Record<string, unknown>).id },
  });

  return NextResponse.json(booking, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const businessId = searchParams.get('businessId');
  const serviceId = searchParams.get('serviceId');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const offset = (page - 1) * limit;

  let query = supabase.from('bookings').select('*', { count: 'exact' });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
  } else if (profile?.role === 'vendor') {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id) as unknown as { data: { id: string }[] };
    const ids = businesses?.map((b) => b.id) ?? [];
    query = query.in('business_id', ids);
  } else {
    query = query.eq('customer_id', user.id);
  }

  if (status) query = query.eq('status', status);
  if (businessId) query = query.eq('business_id', businessId);
  if (serviceId) query = query.eq('service_id', serviceId);
  if (fromDate) query = query.gte('start_time', fromDate);
  if (toDate) query = query.lte('end_time', toDate);

  const { data, count, error } = await query
    .order('start_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, limit });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { bookingId, status, cancellationReason } = body;

  if (!bookingId || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  const { data: existing } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .single() as unknown as { data: { status: string } | null };

  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (!validTransitions[existing.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${existing.status} to ${status}` },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'cancelled' && cancellationReason) {
    updateData.cancellation_reason = cancellationReason;
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('id');

  if (!bookingId) {
    return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('customer_id, status')
    .eq('id', bookingId)
    .single() as unknown as { data: { customer_id: string; status: string } | null };

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  if (booking.customer_id !== user.id) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as unknown as { data: { role: string } | null };
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json({ error: 'Cannot cancel a booking in this status' }, { status: 400 });
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
