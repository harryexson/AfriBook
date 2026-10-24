import { NextRequest, NextResponse } from 'next/server';
import { photonResults } from '@/lib/address-results';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get('q')?.trim() || '';
  const country = params.get('country')?.toUpperCase();
  const reverse = params.get('mode') === 'reverse';
  const lat = Number(params.get('lat')), lon = Number(params.get('lon'));
  if ((!reverse && (q.length < 3 || q.length > 200)) ||
      (country && !/^[A-Z]{2}$/.test(country)) ||
      (reverse && (!params.has('lat') || !params.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180))) {
    return NextResponse.json({ error: 'Enter a valid address or coordinates.' }, { status: 400 });
  }
  const limit = await checkRateLimit(`geo:${req.headers.get('x-forwarded-for')?.split(',')[0] || 'local'}`, 40, 60000);
  if (!limit.allowed) return NextResponse.json({ error: 'Please pause before searching again.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });
  try {
    // Server-controlled endpoint, never a URL supplied by the requester.
    const base = process.env.PHOTON_API_URL || 'https://photon.komoot.io';
    const url = new URL(`${base.replace(/\/$/, '')}/${reverse ? 'reverse' : 'api'}/`);
    url.searchParams.set('limit', reverse ? '1' : '5');
    url.searchParams.set('lang', 'en');
    if (reverse) { url.searchParams.set('lat', String(lat)); url.searchParams.set('lon', String(lon)); }
    else { url.searchParams.set('q', q); if (country) url.searchParams.set('countrycode', country); }
    const response = await fetch(url, { headers: { 'User-Agent': 'AfriBook address search' }, signal: AbortSignal.timeout(12000), cache: 'no-store' });
    if (!response.ok) throw new Error('Geocoder unavailable');
    const results = photonResults(await response.json());
    return NextResponse.json({ data: results, attribution: '© OpenStreetMap contributors · Photon' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Address search is temporarily unavailable. Please retry.' }, { status: 503 });
  }
}
