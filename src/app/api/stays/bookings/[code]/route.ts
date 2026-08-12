import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { resolveStayHotel, resolveStayRoom } from '@/lib/stays/resolver'
import { stayBookingFromDb, stayHotelFromDb, stayRoomFromDb } from '@/lib/stays/types'
import { toBookingLookup } from '@/lib/stays/lookup'
import { getMockBookingByCode } from '@/lib/stays/mock-store'

export const runtime = 'nodejs'

type DbRow = Record<string, unknown>

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  const bookingCode = code.toUpperCase()

  const db = getStaysDb()
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
        const hotel = stayHotelFromDb((row.hotel as DbRow | null) ?? {})
        const room = stayRoomFromDb((row.room as DbRow | null) ?? {})
        return NextResponse.json({
          success: true,
          data: toBookingLookup(booking, hotel, room),
        })
      }
    }
  }

  const mock = getMockBookingByCode(bookingCode)
  if (mock) {
    const hotel = await resolveStayHotel(null, mock.hotelId)
    const room = await resolveStayRoom(null, mock.hotelId, mock.roomId)
    return NextResponse.json({
      success: true,
      data: toBookingLookup(mock, hotel, room),
    })
  }

  return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
}
