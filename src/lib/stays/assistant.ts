// ─────────────────────────────────────────────────────────────
// StaysCape — StayAssistant & smart cross-sell bundles.
//
// Deterministic, dependency-light "AI concierge" that surfaces
// local, money-saving guidance for a stay, plus a bundle that
// pairs the hotel booking with rides and food from the same
// country so guests save more by booking inside One App.
// ─────────────────────────────────────────────────────────────

import { estimateRideFare } from '@/lib/ridely/ride-pricing'
import { getCountryBusinesses } from '@/lib/countries-data'
import { COUNTRIES } from '@/lib/localization/countries'
import { round2 } from './pricing'
import type { StayHotel } from './types'

export type BundleItemType = 'ride' | 'food' | 'event'

export interface StayTip {
  icon: string
  title: string
  body: string
}

export interface BundleItem {
  type: BundleItemType
  title: string
  description: string
  amount: number
  discountedAmount: number
  discountPercent: number
  currencyCode: string
  href?: string
}

export interface StayBundle {
  items: BundleItem[]
  standaloneTotal: number
  bundleTotal: number
  savings: number
  savingsPercent: number
  currencyCode: string
}

export interface BundleEventInput {
  id: string
  title: string
  minPrice: number
  currencyCode: string
}

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ─── StayAssistant tips ──────────────────────────────────────

export function getStayTips(hotel: StayHotel, countryCode?: string): StayTip[] {
  const cc = countryCode ?? hotel.countryCode
  const country = COUNTRIES[cc]
  const currency = country?.currency?.code ?? hotel.currencyCode
  const name = hotel.name

  return [
    {
      icon: 'piggy-bank',
      title: `Book in ${currency} and skip FX surprises`,
      body: `You're viewing ${name} priced in ${currency}. AfriBook charges no hidden conversion markup — the price you see is the price you pay, settled in ${currency}.`,
    },
    {
      icon: 'sparkles',
      title: 'Earn bundle savings on every stay',
      body: 'Pair your room with a local ride and a meal order through One App and save up to 15% versus booking separately.',
    },
    {
      icon: 'calendar',
      title: country ? `Best time to visit ${hotel.city}, ${country.name}` : `Best time to visit ${hotel.city}`,
      body: 'Weekday stays tend to run cheaper and check-in is usually faster. Flexible dates can unlock noticeably better nightly rates.',
    },
    {
      icon: 'shield-check',
      title: '3% host commission — a fair deal for everyone',
      body: `Hosts on StaysCape pay a flat 3% platform fee, far below the ~15% charged elsewhere, and guests get the same protection and support.`,
    },
  ]
}

// ─── Bundle builder ──────────────────────────────────────────

function pickFoodBusiness(hotel: StayHotel, countryCode: string) {
  const businesses = getCountryBusinesses(countryCode).filter(
    (b) =>
      b.category === 'Food & Dining' &&
      (b.deliveryAvailable || b.deliveryRadiusKm > 0) &&
      ((b as BusinessWithPrice)._priceFrom ?? 0) > 0,
  )
  if (businesses.length === 0) return null
  const idx = hashSeed(hotel.id) % businesses.length
  return businesses[idx]
}

interface BusinessWithPrice {
  _priceFrom?: number
  _currencyCode?: string
}

/**
 * Build a cross-sell bundle for a stay. Ride fare is derived from the real
 * per-country ride table; food uses a deterministic local dining business;
 * an event can optionally be attached (e.g. from the live events API).
 */
export function buildStayBundle(
  hotel: StayHotel,
  countryCode: string,
  event?: BundleEventInput | null,
): StayBundle {
  const cc = countryCode
  const country = COUNTRIES[cc]
  const currencyCode = country?.currency?.code ?? hotel.currencyCode
  const items: BundleItem[] = []

  // 1. Ride — airport transfer baseline (18km, 30 min).
  const fare = estimateRideFare('economy', 18, 30, cc)
  const rideAmount = round2(fare.estimatedFare)
  items.push({
    type: 'ride',
    title: 'Airport → Hotel transfer',
    description: 'Pre-booked private ride with surge protection, ready when you land.',
    amount: rideAmount,
    discountedAmount: round2(rideAmount * 0.9),
    discountPercent: 10,
    currencyCode,
    href: '/rides',
  })

  // 2. Food — a locally-vetted restaurant order.
  const food = pickFoodBusiness(hotel, cc)
  const foodAmount = food ? round2((food as BusinessWithPrice)._priceFrom ?? 0) : 0
  if (food && foodAmount > 0) {
    items.push({
      type: 'food',
      title: `Welcome meal from ${food.name}`,
      description: 'Delivered to your room door — trusted, locally-vetted dining.',
      amount: foodAmount,
      discountedAmount: round2(foodAmount * 0.85),
      discountPercent: 15,
      currencyCode,
      href: `/${cc}/business/${food.id}`,
    })
  }

  // 3. Event — attach a live event if one was provided.
  if (event && event.minPrice > 0) {
    items.push({
      type: 'event',
      title: event.title,
      description: 'One tap away from your stay — tickets with no booking surcharge.',
      amount: round2(event.minPrice),
      discountedAmount: round2(event.minPrice * 0.9),
      discountPercent: 10,
      currencyCode: event.currencyCode,
      href: '/events',
    })
  }

  const standaloneTotal = round2(items.reduce((sum, i) => sum + i.amount, 0))
  const bundleTotal = round2(items.reduce((sum, i) => sum + i.discountedAmount, 0))
  const savings = round2(standaloneTotal - bundleTotal)
  const savingsPercent =
    standaloneTotal > 0 ? Math.round((savings / standaloneTotal) * 100) : 0

  return { items, standaloneTotal, bundleTotal, savings, savingsPercent, currencyCode }
}

/** Attach a guest's accepted bundle to the booking metadata. */
export function bundleToGuestMetadata(bundle: unknown): Record<string, unknown> {
  if (!bundle || typeof bundle !== 'object') return { bundles: [] }
  const b = bundle as Partial<StayBundle> & { items?: BundleItem[] }
  if (!Array.isArray(b.items)) return { bundles: [] }
  return {
    bundles: [
      {
        items: b.items.map((i) => ({
          type: i.type,
          title: i.title,
          amount: i.amount,
          discountedAmount: i.discountedAmount,
        })),
        standaloneTotal: b.standaloneTotal ?? 0,
        bundleTotal: b.bundleTotal ?? 0,
        savings: b.savings ?? 0,
        savingsPercent: b.savingsPercent ?? 0,
      },
    ],
  }
}
