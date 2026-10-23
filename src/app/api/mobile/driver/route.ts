import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();
    const [driver] = await query('SELECT id, status, rating, total_trips FROM drivers WHERE profile_id = $1', [user.id]);
    if (!driver) return NextResponse.json({ driver: null, offers: [], activeRide: null });
    const offers = await query(`SELECT o.id, o.ride_id, o.expires_at, r.pickup_address, r.destination_address,
      r.estimated_fare, r.pricing FROM driver_offers o JOIN ridely_rides r ON r.id = o.ride_id
      WHERE o.driver_id = $1 AND o.status = 'pending' AND o.expires_at > now()
      AND r.status IN ('requesting', 'searching') ORDER BY o.expires_at LIMIT 10`, [driver.id]);
    const [activeRide] = await query(`SELECT id, status, pickup_address, destination_address, pricing
      FROM ridely_rides WHERE driver_id = $1 AND status IN ('accepted', 'en_route', 'arrived', 'in_progress')
      ORDER BY requested_at DESC LIMIT 1`, [driver.id]);
    return NextResponse.json({ driver, offers, activeRide: activeRide || null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const status = (err as { status?: number }).status === 401 ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Sign in to access your driver account' : 'Could not load your driver dashboard' }, { status });
  }
}
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser(); const { offerId } = await req.json();
    const rows = await query(`UPDATE driver_offers SET status = 'declined' WHERE id = $1 AND status = 'pending'
      AND driver_id IN (SELECT id FROM drivers WHERE profile_id = $2) RETURNING id`, [offerId, user.id]);
    if (!rows.length) return NextResponse.json({ error: 'Offer expired or unavailable' }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (err) {
    const status = (err as { status?: number }).status === 401 ? 401 : 500;
    return NextResponse.json({ error: 'Could not decline this offer' }, { status });
  }
}
