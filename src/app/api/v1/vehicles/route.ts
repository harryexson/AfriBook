import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { authenticateApiRequest, isApiAuthError, logApiKeyUsage } from '@/lib/api-auth';

const VEHICLE_COLUMNS = `
  id, host_id, company_name, make, model, year, color, vehicle_type, transmission,
  fuel_type, seats, license_plate, vin, status, insurance_verified, insurance_expiry,
  registration_verified, country_code, city, address, price_per_day, currency_code,
  security_deposit, mileage_limit_per_day, platform_fee_percent, cover_image_url,
  gallery_images, features, rating, review_count, is_company_fleet, created_at, updated_at
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
    const offset = (page - 1) * pageSize;

    const whereClauses = ['host_id = $1'];
    const params: unknown[] = [auth.hostId];
    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }
    const whereSql = whereClauses.join(' AND ');

    const [rows, [{ count }]] = await Promise.all([
      query(
        `SELECT ${VEHICLE_COLUMNS} FROM rental_vehicles WHERE ${whereSql}
         ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset],
      ),
      query<{ count: string }>(`SELECT COUNT(*) FROM rental_vehicles WHERE ${whereSql}`, params),
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

    const required = ['make', 'model', 'year', 'licensePlate', 'countryCode', 'city', 'pricePerDay'];
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missing.length > 0) {
      await logApiKeyUsage(auth.apiKeyId, request, 400, startedAt);
      return NextResponse.json({ success: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    const [row] = await query(
      `INSERT INTO rental_vehicles (
         host_id, company_name, make, model, year, color, vehicle_type, transmission,
         fuel_type, seats, license_plate, vin, country_code, city, address,
         price_per_day, currency_code, security_deposit, mileage_limit_per_day,
         cover_image_url, gallery_images, features
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING ${VEHICLE_COLUMNS}`,
      [
        auth.hostId,
        body.companyName ?? null,
        body.make,
        body.model,
        body.year,
        body.color ?? null,
        body.vehicleType ?? 'sedan',
        body.transmission ?? 'automatic',
        body.fuelType ?? 'petrol',
        body.seats ?? 4,
        body.licensePlate,
        body.vin ?? null,
        body.countryCode,
        body.city,
        body.address ?? null,
        body.pricePerDay,
        body.currencyCode ?? 'USD',
        body.securityDeposit ?? 0,
        body.mileageLimitPerDay ?? null,
        body.coverImageUrl ?? null,
        JSON.stringify(body.galleryImages ?? []),
        JSON.stringify(body.features ?? []),
      ],
    );

    await logApiKeyUsage(auth.apiKeyId, request, 201, startedAt);
    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (err) {
    await logApiKeyUsage(auth.apiKeyId, request, 500, startedAt);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
