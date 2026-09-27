import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { authenticateApiRequest, isApiAuthError, logApiKeyUsage } from '@/lib/api-auth';

const BOOKING_COLUMNS = `
  id, booking_code, vehicle_id, renter_id, host_id, start_date, end_date, days,
  price_per_day, subtotal, platform_fee, tax, security_deposit, total, currency_code,
  status, payment_status, pickup_location, dropoff_location, renter_name, renter_phone,
  renter_license_verified, special_requests, cancellation_reason, picked_up_at,
  returned_at, cancelled_at, created_at, updated_at
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
    const offset = (page - 1) * pageSize;

    const whereClauses = ['host_id = $1'];
    const params: unknown[] = [auth.hostId];
    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }
    if (vehicleId) {
      params.push(vehicleId);
      whereClauses.push(`vehicle_id = $${params.length}`);
    }
    const whereSql = whereClauses.join(' AND ');

    const [rows, [{ count }]] = await Promise.all([
      query(
        `SELECT ${BOOKING_COLUMNS} FROM rental_bookings WHERE ${whereSql}
         ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset],
      ),
      query<{ count: string }>(`SELECT COUNT(*) FROM rental_bookings WHERE ${whereSql}`, params),
    ]);

    await logApiKeyUsage(auth.apiKeyId, request, 200, startedAt);
    return NextResponse.json({
      success: true,
      data: rows,
      pagination: { page, pageSize, totalCount: Number(count), hasMore: Number(count) > offset + pageSize },
    });
  } catch (err) {
    await logApiKeyUsage(auth.apiKeyId, request, 500, startedAt);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
