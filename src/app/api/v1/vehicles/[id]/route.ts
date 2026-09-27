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

const UPDATABLE_FIELDS: Record<string, string> = {
  companyName: 'company_name',
  color: 'color',
  transmission: 'transmission',
  fuelType: 'fuel_type',
  seats: 'seats',
  vin: 'vin',
  address: 'address',
  pricePerDay: 'price_per_day',
  currencyCode: 'currency_code',
  securityDeposit: 'security_deposit',
  mileageLimitPerDay: 'mileage_limit_per_day',
  coverImageUrl: 'cover_image_url',
  isCompanyFleet: 'is_company_fleet',
};
const JSON_FIELDS = new Set(['galleryImages', 'features']);
const JSON_COLUMNS: Record<string, string> = { galleryImages: 'gallery_images', features: 'features' };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(request, 'vehicles');
  if (isApiAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const [row] = await query(
    `SELECT ${VEHICLE_COLUMNS} FROM rental_vehicles WHERE id = $1 AND host_id = $2`,
    [id, auth.hostId],
  );

  if (!row) {
    await logApiKeyUsage(auth.apiKeyId, request, 404, startedAt);
    return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
  }

  await logApiKeyUsage(auth.apiKeyId, request, 200, startedAt);
  return NextResponse.json({ success: true, data: row });
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
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
      if (body[key] !== undefined) {
        values.push(body[key]);
        setClauses.push(`${column} = $${values.length}`);
      }
    }
    for (const key of JSON_FIELDS) {
      if (body[key] !== undefined) {
        values.push(JSON.stringify(body[key]));
        setClauses.push(`${JSON_COLUMNS[key]} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      await logApiKeyUsage(auth.apiKeyId, request, 400, startedAt);
      return NextResponse.json({ success: false, error: 'No updatable fields provided' }, { status: 400 });
    }

    setClauses.push('updated_at = NOW()');
    values.push(id, auth.hostId);

    const [row] = await query(
      `UPDATE rental_vehicles SET ${setClauses.join(', ')}
       WHERE id = $${values.length - 1} AND host_id = $${values.length}
       RETURNING ${VEHICLE_COLUMNS}`,
      values,
    );

    if (!row) {
      await logApiKeyUsage(auth.apiKeyId, request, 404, startedAt);
      return NextResponse.json({ success: false, error: 'Vehicle not found or update failed' }, { status: 404 });
    }

    await logApiKeyUsage(auth.apiKeyId, request, 200, startedAt);
    return NextResponse.json({ success: true, data: row });
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
  const rows = await query(
    `DELETE FROM rental_vehicles WHERE id = $1 AND host_id = $2 RETURNING id`,
    [id, auth.hostId],
  );

  if (rows.length === 0) {
    await logApiKeyUsage(auth.apiKeyId, request, 404, startedAt);
    return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
  }

  await logApiKeyUsage(auth.apiKeyId, request, 200, startedAt);
  return NextResponse.json({ success: true });
}
