// ─────────────────────────────────────────────────────────────
// StaysCape — in-memory booking fallback.
//
// Used only when Supabase is unreachable so the booking flow is
// still demonstrable during local development. Data is keyed by
// booking code and lives for the lifetime of the server process.
// ─────────────────────────────────────────────────────────────

import { randomId } from '@/lib/utils'
import type { StayBooking } from './types'

declare global {
  var __stayMockBookings: Map<string, StayBooking> | undefined
}

function store(): Map<string, StayBooking> {
  if (!globalThis.__stayMockBookings) {
    globalThis.__stayMockBookings = new Map()
  }
  return globalThis.__stayMockBookings
}

export function isMockId(id: string): boolean {
  return /^stay-[a-z]{2}-\d+(-r\d+)?$/.test(id)
}

export function generateMockBookingCode(): string {
  return `ST-${randomId(4).toUpperCase()}-${randomId(4).toUpperCase()}`
}

export function saveMockBooking(booking: Omit<StayBooking, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}): StayBooking {
  const now = new Date().toISOString()
  const full: StayBooking = {
    ...booking,
    id: booking.id ?? randomId(),
    createdAt: now,
    updatedAt: now,
  }
  store().set(full.bookingCode, full)
  return full
}

export function getMockBookingByCode(code: string): StayBooking | undefined {
  return store().get(code)
}

export function updateMockBooking(
  code: string,
  patch: Partial<StayBooking>,
): StayBooking | undefined {
  const existing = store().get(code)
  if (!existing) return undefined
  const updated: StayBooking = {
    ...existing,
    ...patch,
    id: existing.id,
    bookingCode: existing.bookingCode,
    updatedAt: new Date().toISOString(),
  }
  store().set(code, updated)
  return updated
}

export function listMockBookings(guestEmail?: string): StayBooking[] {
  const all = Array.from(store().values())
  if (guestEmail) return all.filter((b) => b.guestEmail === guestEmail)
  return all
}
