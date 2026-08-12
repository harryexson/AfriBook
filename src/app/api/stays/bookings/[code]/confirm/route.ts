import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { resolveStayHotel, resolveStayRoom } from '@/lib/stays/resolver'
import { stayBookingFromDb, stayHotelFromDb, stayRoomFromDb } from '@/lib/stays/types'
import { toBookingLookup } from '@/lib/stays/lookup'
import { getMockBookingByCode, updateMockBooking } from '@/lib/stays/mock-store'
import type { StayBooking } from '@/lib/stays/types'

export const runtime = 'nodejs'

type DbRow = Record<string, unknown>

interface ResolvedBooking {
  booking: StayBooking
  hotel: ReturnType<typeof stayHotelFromDb>
  room: ReturnType<typeof stayRoomFromDb>
}

async function resolveBooking(db: ReturnType<typeof getStaysDb>, code: string): Promise<ResolvedBooking | null> {
  const bookingCode = code.toUpperCase()

  if (db) {
    const { data, error } = await db
      .from('stay_bookings')
      .select('*, hotel:stay_hotels(*), room:stay_rooms(*)')
      .eq('booking_code', bookingCode)
      .maybeSingle()
    if (!error && data) {
      const row = data as DbRow
      const booking = stayBookingFromDb(row)
      if (booking) {
        return {
          booking,
          hotel: stayHotelFromDb((row.hotel as DbRow | null) ?? {}),
          room: stayRoomFromDb((row.room as DbRow | null) ?? {}),
        }
      }
    }
  }

  const mock = getMockBookingByCode(bookingCode)
  if (mock) {
    const hotel = await resolveStayHotel(null, mock.hotelId)
    const room = await resolveStayRoom(null, mock.hotelId, mock.roomId)
    return { booking: mock, hotel, room }
  }

  return null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const paymentIntentId = body.paymentIntentId ? String(body.paymentIntentId) : null
  const paymentMethod = body.paymentMethod ? String(body.paymentMethod) : 'demo'

  const db = getStaysDb()
  const resolved = await resolveBooking(db, code)
  if (!resolved) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const { booking } = resolved
  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'This booking has been cancelled' }, { status: 409 })
  }

  const patch: Partial<StayBooking> = {
    status: 'confirmed',
    paymentStatus: 'completed',
    paymentMethod,
    paymentIntentId,
    updatedAt: new Date().toISOString(),
  }

  let saved: StayBooking | null = booking
  let persistedToDb = false

  if (db && !/^stay-/.test(booking.hotelId)) {
    const { data, error } = await db
      .from('stay_bookings')
      .update({
        status: 'confirmed',
        payment_status: 'completed',
        payment_method: paymentMethod,
        payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', booking.bookingCode)
      .select()
      .single()

    if (error) {
      const updatedMock = updateMockBooking(booking.bookingCode, patch)
      saved = updatedMock ?? booking
    } else {
      saved = stayBookingFromDb(data as DbRow) ?? booking
      persistedToDb = true
    }
  } else {
    const updatedMock = updateMockBooking(booking.bookingCode, patch)
    saved = updatedMock ?? booking
  }

  const hotel = saved.hotelId === booking.hotelId ? resolved.hotel : null
  const room = saved.roomId === booking.roomId ? resolved.room : null

  const mockPayment = !paymentIntentId

  return NextResponse.json({
    success: true,
    data: {
      booking: toBookingLookup(saved, hotel, room),
      mockPayment,
      persisted: persistedToDb,
    },
  })
}
