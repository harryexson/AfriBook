import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { checkStayRoomAvailability } from '@/lib/stays/availability'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: _id } = await params
  void _id
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const roomId = String(body.roomId ?? '')
  const checkIn = String(body.checkIn ?? '')
  const checkOut = String(body.checkOut ?? '')
  const rooms = Math.max(1, Math.floor(Number(body.rooms) || 1))

  if (!roomId || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'Missing roomId, checkIn or checkOut' }, { status: 400 })
  }

  const db = getStaysDb()
  const availability = await checkStayRoomAvailability(db, roomId, checkIn, checkOut, rooms)

  return NextResponse.json({ success: true, data: availability })
}
