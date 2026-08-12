import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { resolveStayHotel, resolveStayRooms } from '@/lib/stays/resolver'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const db = getStaysDb()
  const hotel = await resolveStayHotel(db, id)

  if (!hotel) {
    return NextResponse.json({ error: 'Stay not found' }, { status: 404 })
  }

  const rooms = await resolveStayRooms(db, hotel.id)

  return NextResponse.json({
    success: true,
    data: { hotel, rooms },
  })
}
