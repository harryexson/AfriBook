import { NextRequest, NextResponse } from 'next/server';
import {
  RIDE_TYPE_CONFIG,
  type RideType,
} from '@/types/ridely';
import { getCurrencyForCountry } from '@/lib/money';
import { query } from '@/lib/neon/admin';

function calculateSurgeMultiplier(activeDrivers: number, activeRequests: number): number {
  if (activeDrivers === 0) return 3.0;
  const ratio = activeRequests / activeDrivers;
  if (ratio <= 0.5) return 1.0;
  if (ratio <= 1.0) return 1.2;
  if (ratio <= 1.5) return 1.5;
  if (ratio <= 2.0) return 2.0;
  if (ratio <= 3.0) return 2.5;
  return 3.0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const rideType = (searchParams.get('rideType') ?? 'economy') as RideType;
    const countryCode = searchParams.get('countryCode');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'lat and lng query parameters are required' },
        { status: 400 },
      );
    }

    if (!RIDE_TYPE_CONFIG[rideType]) {
      return NextResponse.json(
        { success: false, error: `Invalid rideType: ${rideType}` },
        { status: 400 },
      );
    }

    const country = typeof countryCode === 'string' && countryCode ? countryCode : 'NG';
    const currencyCode = getCurrencyForCountry(country);

    const surgeRows = await query<{ multiplier: number | null }>(
      'SELECT get_surge_multiplier($1, $2) AS multiplier',
      [lat, lng],
    );
    const multiplierFromZone = surgeRows[0]?.multiplier ?? 1;

    if (multiplierFromZone > 1) {
      const cfg = RIDE_TYPE_CONFIG[rideType];
      return NextResponse.json({
        success: true,
        data: {
          multiplier: multiplierFromZone,
          reason: 'High demand in area',
          activeDrivers: 0,
          activeRequests: 0,
          estimatedFare: {
            baseFare: cfg.baseFare,
            perKmRate: cfg.perKmRate,
            perMinRate: cfg.perMinRate,
            minimumFare: cfg.minimumFare,
            surgeMultiplier: multiplierFromZone,
            estimatedFare: Math.round(cfg.baseFare * multiplierFromZone),
            currencyCode,
          },
        },
      });
    }

    const searchRadius = 3;
    const nearbyDrivers = await query(
      'SELECT * FROM ridely_find_nearby_drivers($1, $2, $3, $4)',
      [lat, lng, searchRadius, rideType],
    );

    const activeDrivers = nearbyDrivers?.length ?? 0;

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const countRows = await query<{ count: string }>(
      `SELECT count(*) FROM ridely_rides
       WHERE status IN ('requesting', 'searching') AND created_at >= $1`,
      [fiveMinAgo],
    );
    const activeRequests = Number(countRows[0]?.count ?? 0);

    const multiplier = calculateSurgeMultiplier(activeDrivers, activeRequests ?? 0);

    const cfg = RIDE_TYPE_CONFIG[rideType];
    const estimatedFare = {
      baseFare: cfg.baseFare,
      perKmRate: cfg.perKmRate,
      perMinRate: cfg.perMinRate,
      minimumFare: cfg.minimumFare,
      surgeMultiplier: multiplier,
      estimatedFare: Math.round(cfg.baseFare * multiplier),
      currencyCode,
    };

    return NextResponse.json({
      success: true,
      data: {
        multiplier,
        reason:
          multiplier > 1
            ? `High demand: ${activeRequests ?? 0} requests for ${activeDrivers} drivers`
            : 'Normal pricing',
        activeDrivers,
        activeRequests: activeRequests ?? 0,
        estimatedFare,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
