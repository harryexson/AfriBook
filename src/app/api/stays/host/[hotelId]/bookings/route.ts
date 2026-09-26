import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { requireAuthenticatedUser } from '@/lib/neon/server'

export const runtime = 'nodejs'

/** Guest bookings/requests for one property, plus a simple earnings summary — the core of the host dashboard's "how am I doing" view. */
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

  const { data: hotel } = await db.from('stay_hotels').select('id, host_id').eq('id', hotelId).maybeSingle()
  if (!hotel || (hotel as { host_id: string }).host_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: bookings, error } = await db
    .from('stay_bookings')
    .select('id, booking_code, guest_name, guest_email, guest_phone, check_in_date, check_out_date, nights, guests, total, currency_code, status, payment_status, special_requests, created_at')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }

  const rows = (bookings ?? []) as { total: number; status: string; payment_status: string; currency_code: string }[]
  const completedOrConfirmed = rows.filter((b) => ['confirmed', 'checked_in', 'completed'].includes(b.status))
  const totalEarnings = completedOrConfirmed
    .filter((b) => b.payment_status === 'completed')
    .reduce((sum, b) => sum + Number(b.total ?? 0), 0)

  return NextResponse.json({
    success: true,
    data: {
      bookings: rows,
      summary: {
        totalBookings: rows.length,
        pendingRequests: rows.filter((b) => b.status === 'pending').length,
        totalEarnings,
        currencyCode: rows[0]?.currency_code ?? 'USD',
      },
    },
  })
}

const HOST_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['completed'],
}

/** Host approves/declines a guest request, or checks a guest in/out. */
export async function PATCH(
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

  const { data: hotel } = await db.from('stay_hotels').select('id, host_id').eq('id', hotelId).maybeSingle()
  if (!hotel || (hotel as { host_id: string }).host_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { bookingId?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body.bookingId || !body.status) {
    return NextResponse.json({ error: 'bookingId and status are required' }, { status: 400 })
  }

  const { data: booking } = await db
    .from('stay_bookings')
    .select('id, status, hotel_id')
    .eq('id', body.bookingId)
    .maybeSingle()

  const current = booking as { id: string; status: string; hotel_id: string } | null
  if (!current || current.hotel_id !== hotelId) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (!HOST_ALLOWED_TRANSITIONS[current.status]?.includes(body.status)) {
    return NextResponse.json({ error: `Cannot move a ${current.status} booking to ${body.status}` }, { status: 400 })
  }

  const update: Record<string, unknown> = { status: body.status, updated_at: new Date().toISOString() }
  if (body.status === 'checked_in') update.checked_in_at = new Date().toISOString()
  if (body.status === 'completed') update.checked_out_at = new Date().toISOString()
  if (body.status === 'cancelled') update.cancelled_at = new Date().toISOString()

  const { data, error } = await db
    .from('stay_bookings')
    .update(update)
    .eq('id', body.bookingId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
