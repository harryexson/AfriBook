// ─────────────────────────────────────────────────────────────
// StaysCape — hotel/room resolver.
//
// Single source for resolving a hotel (and its rooms) across both
// storage backends:
//   • mock ids look like `stay-ng-0` / `stay-ng-0-r0`
//   • DB rows are keyed by UUID (or looked up by slug)
// ─────────────────────────────────────────────────────────────

import { getStayHotelById, getStayRoomsForHotel } from './stays-data'
import { toStayHotel, toStayRoom, stayHotelFromDb, stayRoomFromDb } from './types'
import type { StayHotel, StayRoom } from './types'
import type { Db } from './db'

function mockCountryFromId(id: string): string | null {
  const match = id.match(/^stay-([a-z]{2})-\d+$/)
  return match ? match[1].toUpperCase() : null
}

export async function resolveStayHotel(
  db: Db | null,
  idOrSlug: string,
): Promise<StayHotel | null> {
  const mockCountry = mockCountryFromId(idOrSlug)
  if (mockCountry) {
    const mock = getStayHotelById(mockCountry, idOrSlug)
    return mock ? toStayHotel(mock) : null
  }

  if (!db) return null

  const { data, error } = await db
    .from('stay_hotels')
    .select('*')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .single()

  if (error || !data) return null
  return stayHotelFromDb(data as Record<string, unknown>)
}

export async function resolveStayRooms(
  db: Db | null,
  hotelId: string,
): Promise<StayRoom[]> {
  const mockCountry = mockCountryFromId(hotelId)
  if (mockCountry) {
    return getStayRoomsForHotel(hotelId).map((room) => toStayRoom(room))
  }

  if (!db) return []

  const { data, error } = await db
    .from('stay_rooms')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('price_per_night', { ascending: true })

  if (error || !data) return []
  return (data as Record<string, unknown>[])
    .map((row) => stayRoomFromDb(row))
    .filter((room): room is StayRoom => room !== null)
}

export async function resolveStayRoom(
  db: Db | null,
  hotelId: string,
  roomId: string,
): Promise<StayRoom | null> {
  const rooms = await resolveStayRooms(db, hotelId)
  return rooms.find((r) => r.id === roomId) ?? null
}
