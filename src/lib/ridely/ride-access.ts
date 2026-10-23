import { requireAuthenticatedUser } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';
export async function requireRideActor(ride: { rider_id: string; driver_id: string | null }) {
  const { user } = await requireAuthenticatedUser();
  if (ride.rider_id === user.id) return 'rider' as const;
  if (ride.driver_id) {
    const rows = await query('SELECT id FROM drivers WHERE id = $1 AND profile_id = $2', [ride.driver_id, user.id]);
    if (rows.length) return 'driver' as const;
  }
  const wards = await query('SELECT id FROM profiles WHERE id = $1 AND guardian_id = $2', [ride.rider_id, user.id]);
  if (wards.length) return 'rider' as const;
  throw Object.assign(new Error('You do not have access to this ride'), { status: 403 });
}
