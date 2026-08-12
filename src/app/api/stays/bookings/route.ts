import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { resolveStayHotel, resolveStayRoom } from '@/lib/stays/resolver'
import { computeStayPrice, round2 } from '@/lib/stays/pricing'
import { checkStayRoomAvailability } from '@/lib/stays/availability'
import { stayBookingFromDb } from '@/lib/stays/types'
import { bundleToGuestMetadata } from '@/lib/stays/assistant'
import {
  saveMockBooking,
  generateMockBookingCode,
} from '@/lib/stays/mock-store'
import { requireAuthenticatedUser } from '@/lib/supabase/server'
import type { StayBooking } from '@/lib/stays/types'

export const runtime = 'nodejs'

type HotelRow = Record<string, unknown>

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hotelId = String(body.hotelId ?? '')
  const roomId = String(body.roomId ?? '')
  const checkInDate = String(body.checkInDate ?? '')
  const checkOutDate = String(body.checkOutDate ?? '')
  const guestName = String(body.guestName ?? '').trim()
  const guestEmail = String(body.guestEmail ?? '').trim()
  const guestPhone = String(body.guestPhone ?? '').trim()
  const specialRequests = String(body.specialRequests ?? '').trim()
  const guestMessage = String(body.guestMessage ?? '').trim()
  const guests = Math.max(1, Math.floor(Number(body.guests) || 1))
  const bundle = body.bundle ?? null

  const missing = ['hotelId', 'roomId', 'checkInDate', 'checkOutDate', 'guestName', 'guestEmail'].filter(
    (field) => !body[field],
  )
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
  }

  const db = getStaysDb()
  const hotel = await resolveStayHotel(db, hotelId)
  if (!hotel) {
    return NextResponse.json({ error: 'Stay not found' }, { status: 404 })
  }
  const room = await resolveStayRoom(db, hotelId, roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const availability = await checkStayRoomAvailability(db, roomId, checkInDate, checkOutDate, 1)
  if (!availability.available) {
    return NextResponse.json(
      { error: availability.reason ?? 'Room unavailable for selected dates', details: availability },
      { status: 409 },
    )
  }

  const price = computeStayPrice({
    pricePerNight: room.pricePerNight,
    checkInDate,
    checkOutDate,
    platformFeePercent: hotel.platformFeePercent,
    taxRate: hotel.taxRate,
    currencyCode: hotel.currencyCode,
    rooms: 1,
  })

  const metadata = bundleToGuestMetadata(bundle)

  const insertPayload: HotelRow = {
    hotel_id: hotel.id,
    room_id: room.id,
    guest_id: null,
    guest_name: guestName,
    guest_email: guestEmail,
    guest_phone: guestPhone,
    check_in_date: String(checkInDate).slice(0, 10),
    check_out_date: String(checkOutDate).slice(0, 10),
    nights: price.nights,
    guests,
    price_per_night: round2(room.pricePerNight),
    subtotal: price.subtotal,
    platform_fee: price.platformFee,
    tax: price.tax,
    total: price.total,
    currency_code: hotel.currencyCode,
    status: 'pending',
    payment_status: 'pending',
    special_requests: specialRequests,
    guest_message: guestMessage,
  }

  if (db) {
    try {
      const attempt = (payload: HotelRow) =>
        db.from('stay_bookings').insert(payload).select().single()

      const first = await attempt({ ...insertPayload, guest_metadata: metadata })
      let row: HotelRow | null = null
      let note = ''

      if (first.error) {
        // guest_metadata may not exist yet (pre-migration-009) — retry without it.
        const retry = await attempt(insertPayload)
        if (retry.error) {
          console.warn('[stays] booking insert failed, falling back to mock:', retry.error)
        } else {
          row = retry.data as HotelRow
          note = 'guest_metadata_not_persisted'
        }
      } else {
        row = first.data as HotelRow
      }

      if (row) {
        const booking = stayBookingFromDb(row)
        if (booking) {
          if (note === 'guest_metadata_not_persisted') booking.guestMetadata = metadata
          return NextResponse.json({ success: true, data: booking, persisted: true }, { status: 201 })
        }
      }
    } catch {
      // fall through to mock
    }
  }

  const mock: StayBooking = saveMockBooking({
    bookingCode: generateMockBookingCode(),
    hotelId: hotel.id,
    roomId: room.id,
    guestId: null,
    guestName,
    guestEmail,
    guestPhone,
    checkInDate: String(checkInDate).slice(0, 10),
    checkOutDate: String(checkOutDate).slice(0, 10),
    nights: price.nights,
    guests,
    pricePerNight: round2(room.pricePerNight),
    subtotal: price.subtotal,
    platformFee: price.platformFee,
    tax: price.tax,
    total: price.total,
    currencyCode: hotel.currencyCode,
    status: 'pending',
    paymentStatus: 'pending',
    paymentIntentId: null,
    paymentMethod: null,
    specialRequests,
    guestMessage,
    guestMetadata: metadata,
  })

  return NextResponse.json({ success: true, data: mock, persisted: false }, { status: 201 })
}

export async function GET() {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>
  try {
    auth = await requireAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { supabase, user } = auth
  const { data, error } = await supabase
    .from('stay_bookings')
    .select('*')
    .or(`guest_id.eq.${user.id},guest_email.eq.${user.email ?? ''}`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ success: true, data: [] })
  }

  const bookings = (data ?? ([] as HotelRow[]))
    .map((row) => stayBookingFromDb(row as HotelRow))
    .filter((b): b is StayBooking => b !== null)

  return NextResponse.json({ success: true, data: bookings })
}
