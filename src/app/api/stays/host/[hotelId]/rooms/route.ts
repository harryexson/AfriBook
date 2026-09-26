import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { requireAuthenticatedUser } from '@/lib/neon/server'

export const runtime = 'nodejs'

async function assertOwnsHotel(db: Awaited<ReturnType<typeof getStaysDb>>, hotelId: string, userId: string) {
  const { data } = await db.from('stay_hotels').select('id').eq('id', hotelId).eq('host_id', userId).maybeSingle()
  return Boolean(data)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> },
) {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>
  try {
    auth = await requireAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { hotelId } = await params
  const db = await getStaysDb()

  if (!(await assertOwnsHotel(db, hotelId, auth.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await db
    .from('stay_rooms')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load rooms' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> },
) {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>
  try {
    auth = await requireAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { hotelId } = await params
  const db = await getStaysDb()

  if (!(await assertOwnsHotel(db, hotelId, auth.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const pricePerNight = Number(body.pricePerNight)
  if (!name || !Number.isFinite(pricePerNight) || pricePerNight <= 0) {
    return NextResponse.json({ error: 'name and a positive pricePerNight are required' }, { status: 400 })
  }

  const { data: hotel } = await db.from('stay_hotels').select('currency_code').eq('id', hotelId).single()

  const { data, error } = await db
    .from('stay_rooms')
    .insert({
      hotel_id: hotelId,
      room_type: String(body.roomType ?? 'standard'),
      name,
      description: String(body.description ?? ''),
      max_occupancy: Math.max(1, Number(body.maxOccupancy) || 2),
      bed_count: Math.max(1, Number(body.bedCount) || 1),
      bathrooms: Math.max(1, Number(body.bathrooms) || 1),
      price_per_night: pricePerNight,
      currency_code: (hotel as { currency_code?: string } | null)?.currency_code ?? 'USD',
      quantity: Math.max(1, Number(body.quantity) || 1),
      available: Math.max(1, Number(body.quantity) || 1),
      photos: Array.isArray(body.photos) ? body.photos.map(String) : [],
      amenities: Array.isArray(body.amenities) ? body.amenities.map(String) : [],
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }

  // Keep the hotel's own room count in sync for the listing card.
  const { count: roomCount } = await db
    .from('stay_rooms')
    .select('id', { count: 'exact', head: true })
    .eq('hotel_id', hotelId)
  await db.from('stay_hotels').update({ rooms_count: roomCount ?? 0 }).eq('id', hotelId)

  return NextResponse.json({ success: true, data }, { status: 201 })
}
