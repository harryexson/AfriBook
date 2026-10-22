import { NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/neon/server'
import { query } from '@/lib/neon/admin'

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser()
    const restaurants = await query(
      `SELECT r.id, b.id AS business_id, b.name, b.country_code
       FROM restaurants r JOIN businesses b ON b.id = r.business_id
       WHERE b.owner_id = $1 ORDER BY b.name`, [user.id],
    )
    return NextResponse.json({ restaurants }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const status = error instanceof Error && 'status' in error && error.status === 401 ? 401 : 503
    return NextResponse.json({ error: status === 401 ? 'Sign in to manage your restaurant.' : 'Restaurant service is unavailable.' }, { status })
  }
}
