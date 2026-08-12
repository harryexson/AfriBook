// ─────────────────────────────────────────────────────────────
// StaysCape — Pricing engine (pure).
//
// The platform fee is the headline differentiator for hosts: a
// flat 3% by default (vs ~15% on Airbnb). Taxes come from the
// country's CountryConfig so every market stays compliant.
// ─────────────────────────────────────────────────────────────

import { DEFAULT_PLATFORM_FEE_PERCENT } from './types'

export interface StayPriceParams {
  pricePerNight: number
  checkInDate: string | Date
  checkOutDate: string | Date
  platformFeePercent?: number
  taxRate?: number
  currencyCode: string
  rooms?: number
}

export interface StayPriceBreakdown {
  nights: number
  subtotal: number
  platformFee: number
  tax: number
  total: number
  currencyCode: string
  platformFeePercent: number
  taxRate: number
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Whole days between two dates (inclusive of the last night). */
export function computeNights(checkInDate: string | Date, checkOutDate: string | Date): number {
  const start = new Date(checkInDate)
  const end = new Date(checkOutDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const msPerDay = 1000 * 60 * 60 * 24
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.max(Math.round((endDay - startDay) / msPerDay), 0)
}

export function isPastDate(date: string | Date): boolean {
  const day = new Date(date)
  const today = new Date()
  const startOf = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).getTime()
  return startOf(day) < startOf(today)
}

/**
 * Compute the full price breakdown for a stay. The server always re-derives
 * this from the room price and date range — never trusts client totals.
 */
export function computeStayPrice(params: StayPriceParams): StayPriceBreakdown {
  const nights = computeNights(params.checkInDate, params.checkOutDate)
  const rooms = Math.max(1, Math.floor(params.rooms ?? 1))
  const platformFeePercent = params.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT
  const taxRate = params.taxRate ?? 0

  const subtotal = round2(params.pricePerNight * nights * rooms)
  const platformFee = round2(subtotal * (platformFeePercent / 100))
  const tax = round2(subtotal * taxRate)
  const total = round2(subtotal + platformFee + tax)

  return {
    nights,
    subtotal,
    platformFee,
    tax,
    total,
    currencyCode: params.currencyCode,
    platformFeePercent,
    taxRate,
  }
}

/** Convenience wrapper when you already have a StayRoom and a country config. */
export function computeStayPriceForRoom(params: {
  pricePerNight: number
  checkInDate: string | Date
  checkOutDate: string | Date
  platformFeePercent?: number
  taxRate?: number
  currencyCode: string
  rooms?: number
}): StayPriceBreakdown {
  return computeStayPrice(params)
}

/** Net the host receives for a booking after the 3% platform fee. */
export function hostPayoutForBooking(subtotal: number, platformFeePercent?: number): number {
  const percent = platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT
  return round2(subtotal * (1 - percent / 100))
}
