// ─────────────────────────────────────────────────────────────
// StaysCape — Availability engine.
//
// Real check: Supabase RPC `check_stay_room_availability` from
// migration 008 (walks each night, respects blocked dates and
// base inventory).
//
// Fallback (no reachable Supabase / table not yet migrated):
// deterministic mock check against the per-country seed rooms.
// ─────────────────────────────────────────────────────────────

import { getStayRoomById } from './stays-data'
import type { StayAvailability } from './types'
import { isPastDate, computeNights } from './pricing'

type AnySupabase = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>
}

interface RpcResult {
  available?: boolean
  reason?: string
  date?: string
  remaining?: number
  price_per_night?: number
  currency_code?: string
  nights?: number
}

export async function checkStayRoomAvailability(
  supabase: unknown,
  roomId: string,
  checkInDate: string | Date,
  checkOutDate: string | Date,
  rooms = 1,
): Promise<StayAvailability> {
  const client = supabase as AnySupabase

  try {
    const { data, error } = await client.rpc('check_stay_room_availability', {
      p_room_id: roomId,
      p_check_in: String(checkInDate).slice(0, 10),
      p_check_out: String(checkOutDate).slice(0, 10),
      p_rooms: rooms,
    })

    if (error) {
      return checkMockRoomAvailability(roomId, checkInDate, checkOutDate, rooms)
    }

    const result = (data ?? {}) as RpcResult
    return {
      available: result.available === true,
      reason: result.reason,
      date: result.date,
      remaining: result.remaining,
      pricePerNight: result.price_per_night,
      currencyCode: result.currency_code,
      nights: result.nights,
    }
  } catch {
    return checkMockRoomAvailability(roomId, checkInDate, checkOutDate, rooms)
  }
}

/** Deterministic fallback: a seeded room is available unless it is inactive,
 *  the stay starts in the past, or the date range is invalid. */
export function checkMockRoomAvailability(
  roomId: string,
  checkInDate: string | Date,
  checkOutDate: string | Date,
  rooms = 1,
): StayAvailability {
  const hotelId = roomId.replace(/-r\d+$/, '')
  const room = getStayRoomById(hotelId, roomId)
  const nights = computeNights(checkInDate, checkOutDate)

  if (!room) {
    return { available: false, reason: 'room_not_found', nights }
  }
  if (rooms > room.quantity) {
    return {
      available: false,
      reason: 'insufficient_rooms',
      remaining: room.quantity,
      nights,
    }
  }
  if (isPastDate(checkInDate)) {
    return { available: false, reason: 'check_in_in_past', nights }
  }
  if (nights <= 0) {
    return { available: false, reason: 'invalid_date_range', nights }
  }
  if (nights < room.minNights) {
    return { available: false, reason: 'min_nights', nights }
  }

  return {
    available: true,
    pricePerNight: room.pricePerNight,
    currencyCode: room.currencyCode,
    nights,
  }
}
