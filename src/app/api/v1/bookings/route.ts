import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiRequest, isApiAuthError, logApiKeyUsage } from '@/lib/api-auth';

const BOOKING_SELECT = `
  id, vehicle_id, host_id, renter_id, status, start_date, end_date,
  pickup_location_address, pickup_location_city, pickup_location_state,
  dropoff_location_address, dropoff_location_city, dropoff_location_state,
  daily_rate, total_amount, host_earnings, payment_status, escrow_status,
  renter_insurance_verified, renter_license_verified, host_confirmed_at, pickup_confirmed_at,
  dropoff_confirmed_at, cancelled_at, cancellation_reason, created_at, updated_at,
  vehicles (id, title, make, model, year, color, daily_rate)
`;

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(request, 'bookings');
  if (isApiAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));
    const status = searchParams.get('status');
    const vehicleId = searchParams.get('vehicleId');
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const admin = createAdminClient() as any;
    let query = admin
      .from('vehicle_bookings')
      .select(BOOKING_SELECT, { count: 'exact' })
      .eq('host_id', auth.hostId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);

    const { data, error, count } = await query;

    if (error) {
      await logApiKeyUsage(auth.apiKeyId, request, 500, startedAt);
      return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }

    await logApiKeyUsage(auth.apiKeyId, request, 200, startedAt);
    return NextResponse.json({
      success: true,
      data: data ?? [],
      pagination: { page, pageSize, totalCount: count ?? 0, hasMore: (count ?? 0) > to + 1 },
    });
  } catch (err) {
    await logApiKeyUsage(auth.apiKeyId, request, 500, startedAt);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
