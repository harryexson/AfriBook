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

const UPDATABLE_FIELDS: Record<string, string> = {
  title: 'title',
  description: 'description',
  dailyRate: 'daily_rate',
  weeklyDiscountPercent: 'weekly_discount_percent',
  monthlyDiscountPercent: 'monthly_discount_percent',
  cleaningFee: 'cleaning_fee',
  securityDeposit: 'security_deposit',
  deliveryAvailable: 'delivery_available',
  deliveryRadiusKm: 'delivery_radius_km',
  deliveryFeePerKm: 'delivery_fee_per_km',
  isInstantBook: 'is_instant_book',
  isActive: 'is_active',
  mileage: 'mileage',
  condition: 'condition',
  locationAddress: 'location_address',
  locationCity: 'location_city',
  locationState: 'location_state',
  locationPostalCode: 'location_postal_code',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(request, 'vehicles');
  if (isApiAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('vehicles')
    .select(VEHICLE_SELECT)
    .eq('id', id)
    .eq('host_id', auth.hostId)
    .single();

  if (error || !data) {
    await logApiKeyUsage(auth.apiKeyId, request, 404, startedAt);
    return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
  }

  await logApiKeyUsage(auth.apiKeyId, request, 200, startedAt);
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(request, 'vehicles');
  if (isApiAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  if (!auth.scopes.includes('write') && !auth.scopes.includes('admin')) {
    return NextResponse.json({ success: false, error: 'API key is missing required scope: write' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
      if (body[key] !== undefined) updates[column] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      await logApiKeyUsage(auth.apiKeyId, request, 400, startedAt);
      return NextResponse.json({ success: false, error: 'No updatable fields provided' }, { status: 400 });
    }

    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .eq('host_id', auth.hostId)
      .select(VEHICLE_SELECT)
      .single();

    if (error || !data) {
      await logApiKeyUsage(auth.apiKeyId, request, 404, startedAt);
      return NextResponse.json({ success: false, error: 'Vehicle not found or update failed' }, { status: 404 });
    }

    await logApiKeyUsage(auth.apiKeyId, request, 200, startedAt);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    await logApiKeyUsage(auth.apiKeyId, request, 500, startedAt);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(request, 'vehicles');
  if (isApiAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  if (!auth.scopes.includes('write') && !auth.scopes.includes('admin')) {
    return NextResponse.json({ success: false, error: 'API key is missing required scope: write' }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient() as any;
  const { error, count } = await admin
    .from('vehicles')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('host_id', auth.hostId);

  if (error || !count) {
    await logApiKeyUsage(auth.apiKeyId, request, 404, startedAt);
    return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
  }

  await logApiKeyUsage(auth.apiKeyId, request, 200, startedAt);
  return NextResponse.json({ success: true });
}
