import { NextRequest, NextResponse } from 'next/server';
import { getActiveSafetyZones, checkDriverSafetyZone } from '@/lib/pickup/safety-manager';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get('countryCode');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (lat && lng) {
    const zone = await checkDriverSafetyZone(parseFloat(lat), parseFloat(lng));
    return NextResponse.json(zone ?? { inZone: false });
  }

  if (!countryCode) {
    return NextResponse.json({ error: 'countryCode required' }, { status: 400 });
  }

  const zones = await getActiveSafetyZones(countryCode);
  return NextResponse.json(zones);
}
