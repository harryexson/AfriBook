import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiRequest, isApiAuthError, logApiKeyUsage } from '@/lib/api-auth';

const VEHICLE_SELECT = `
  id, host_id, title, description, vehicle_type, make, model, year, color, transmission,
  fuel_type, seats, doors, mileage, condition, license_plate, daily_rate, weekly_discount_percent,
  monthly_discount_percent, cleaning_fee, security_deposit, delivery_available, delivery_radius_km,
  delivery_fee_per_km, is_instant_book, is_active, verification_status, location_address,
  location_city, location_state, location_postal_code, average_rating, review_count,
  total_bookings, created_at, updated_at,
  vehicle_images (url, type, is_primary, display_order)
`;

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(request, 'vehicles');
  if (isApiAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));
    const status = searchParams.get('status');
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const admin = createAdminClient() as any;
    let query = admin
      .from('vehicles')
      .select(VEHICLE_SELECT, { count: 'exact' })
      .eq('host_id', auth.hostId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status === 'active') query = query.eq('is_active', true);
    if (status === 'inactive') query = query.eq('is_active', false);

    const { data, error, count } = await query;

    if (error) {
      await logApiKeyUsage(auth.apiKeyId, request, 500, startedAt);
      return NextResponse.json({ success: false, error: 'Failed to fetch vehicles' }, { status: 500 });
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

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(request, 'vehicles');
  if (isApiAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  if (!auth.scopes.includes('write') && !auth.scopes.includes('admin')) {
    return NextResponse.json({ success: false, error: 'API key is missing required scope: write' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const required = ['title', 'vehicleType', 'make', 'model', 'year', 'transmission', 'fuelType', 'seats', 'doors', 'mileage', 'condition', 'color', 'licensePlate', 'dailyRate', 'locationAddress', 'locationCity', 'locationState', 'locationPostalCode'];
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missing.length > 0) {
      await logApiKeyUsage(auth.apiKeyId, request, 400, startedAt);
      return NextResponse.json({ success: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from('vehicles')
      .insert({
        host_id: auth.hostId,
        title: body.title,
        description: body.description ?? null,
        vehicle_type: body.vehicleType,
        make: body.make,
        model: body.model,
        year: body.year,
        color: body.color,
        transmission: body.transmission,
        fuel_type: body.fuelType,
        seats: body.seats,
        doors: body.doors,
        mileage: body.mileage,
        condition: body.condition,
        license_plate: body.licensePlate,
        daily_rate: body.dailyRate,
        weekly_discount_percent: body.weeklyDiscountPercent ?? 0,
        monthly_discount_percent: body.monthlyDiscountPercent ?? 0,
        cleaning_fee: body.cleaningFee ?? 0,
        security_deposit: body.securityDeposit ?? 0,
        delivery_available: body.deliveryAvailable ?? false,
        delivery_radius_km: body.deliveryRadiusKm ?? 0,
        delivery_fee_per_km: body.deliveryFeePerKm ?? 0,
        is_instant_book: body.isInstantBook ?? false,
        is_active: body.isActive ?? true,
        verification_status: 'pending',
        location_address: body.locationAddress,
        location_city: body.locationCity,
        location_state: body.locationState,
        location_postal_code: body.locationPostalCode,
        total_bookings: 0,
        total_earnings: 0,
        average_rating: 0,
        review_count: 0,
        images: [],
      })
      .select(VEHICLE_SELECT)
      .single();

    if (error) {
      await logApiKeyUsage(auth.apiKeyId, request, 500, startedAt);
      return NextResponse.json({ success: false, error: 'Failed to create vehicle' }, { status: 500 });
    }

    await admin.rpc('increment_host_vehicle_count', { host_id: auth.hostId });

    await logApiKeyUsage(auth.apiKeyId, request, 201, startedAt);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    await logApiKeyUsage(auth.apiKeyId, request, 500, startedAt);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
