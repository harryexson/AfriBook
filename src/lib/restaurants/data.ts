// ─────────────────────────────────────────────────────────────
// AfriBook Food — deterministic restaurant & menu listings for
// every country. Mirrors the StaysCape strategy so the /food
// browse + menu flow is never empty, regardless of Supabase state.
//
// Real restaurants live in the `restaurants` table (seeded per
// market). This module is the guaranteed fallback so a destination
// like "Lilongwe, Malawi" always resolves to location-aware results
// instead of a global/random list.
// ─────────────────────────────────────────────────────────────

import { COUNTRIES, type CountryConfig } from '@/lib/localization/countries'
import { getStayCities } from '@/lib/stays/stays-data'

export interface MockRestaurant {
  id: string
  businessId: string
  name: string
  description: string
  cuisineType: string
  rating: number
  preparationTime: number
  deliveryRadiusKm: number
  minimumOrder: number
  deliveryFee: number
  currency: string
  countryCode: string
  city: string
  address: string
  location: { lat: number; lng: number } | null
  serviceHours: Record<string, unknown>
}

export interface MockMenuItem {
  id: string
  businessId: string
  categoryId: string
  restaurantId: string
  name: string
  description: string
  price: number
  currencyCode: string
  image: string
  ingredients: string[]
  allergens: string[]
  available: boolean
  preparationTime: number
  modifiers: Record<string, unknown>[]
}

export interface MockMenuCategory {
  id: string
  businessId: string
  name: string
  description: string
  sortOrder: number
  items: MockMenuItem[]
}

// ─── Deterministic PRNG (stable per country code) ──────────────
function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rngFor(countryCode: string, salt = ''): () => number {
  return mulberry32(hashSeed(countryCode + salt))
}

// Currencies where a single unit has a very small real-world value, so
// menu prices need bigger magnitudes to look realistic.
const HIGH_UNIT_CURRENCIES = new Set([
  'NGN', 'MWK', 'UGX', 'TZS', 'KES', 'RWF', 'XOF', 'XAF', 'ETB', 'ZMW',
  'GHS', 'EGP', 'MAD', 'GNF', 'BIF', 'MGA', 'MUR', 'MZN', 'SLL', 'AOA',
  'CDF', 'SSP', 'SDG', 'LBP', 'IRR', 'VND', 'IDR', 'KRW', 'JPY',
])

const CUISINES = [
  'African',
  'Grill & BBQ',
  'Fast Food',
  'Continental',
  'Local',
  'Seafood',
  'Café',
  'Street Food',
]

const NAME_TEMPLATES = [
  'Kitchen',
  'Bistro',
  'House',
  'Grill',
  'Spot',
  'Eatery',
  'Corner',
  'Café',
]

const STREETS = [
  'Independence Avenue',
  'Main Street',
  'Market Road',
  'Airport Road',
  'Unity Drive',
  'Central Avenue',
]

const CATEGORY_NAMES = ['Mains', 'Small Plates', 'Drinks & Sides']
const CATEGORY_DESCRIPTIONS = [
  'Signature plates and hearty mains.',
  'Small bites, starters and sides.',
  'Fresh drinks and quick additions.',
]

const MENU_ITEM_NAMES = [
  'Grilled Chicken & Rice',
  'Beef Stew & Ugali',
  'Spiced Fish & Chips',
  'Veggie Bowl',
  'BBQ Skewers',
  'Street Rolls',
  'Fried Plantain',
  'Seasonal Salad',
  'Fresh Juice',
  'Iced Tea',
  'Local Coffee',
  'Mineral Water',
]

function roundFor(currency: CountryConfig['currency'], value: number): number {
  const scale = currency.decimalPlaces === 0 ? 1 : 100
  return Math.round(value * scale) / scale
}

function moneyMagnitude(currencyCode: string, salt = ''): { minOrder: number; fee: number } {
  const isHigh = HIGH_UNIT_CURRENCIES.has(currencyCode)
  const rng = rngFor(currencyCode, 'money' + salt)
  if (isHigh) {
    return {
      minOrder: Math.round(12000 + rng() * 35000),
      fee: Math.round(2000 + rng() * 5000),
    }
  }
  return {
    minOrder: Math.round((8 + rng() * 22) * 100) / 100,
    fee: Math.round((1 + rng() * 3) * 100) / 100,
  }
}

const SERVICE_HOURS: Record<string, unknown> = {
  mon: ['09:00', '22:00'],
  tue: ['09:00', '22:00'],
  wed: ['09:00', '22:00'],
  thu: ['09:00', '22:00'],
  fri: ['09:00', '23:00'],
  sat: ['10:00', '23:00'],
  sun: ['12:00', '21:00'],
}

export function getMockRestaurants(countryCode: string): MockRestaurant[] {
  const country = COUNTRIES[countryCode]
  if (!country) return []

  const rng = rngFor(countryCode, 'restaurants')
  const cities = getStayCities(countryCode)
  const currency = country.currency.code

  // Generate at least one restaurant per city so any destination city
  // always resolves to location-aware results.
  const usedNames = new Set<string>()
  const restaurants: MockRestaurant[] = []

  const latBase = countryCode.charCodeAt(0) * 3 + countryCode.charCodeAt(1)
  const lngBase = countryCode.charCodeAt(1) * 5 - countryCode.charCodeAt(0)

  let counter = 0
  for (const city of cities) {
    const perCity = 1 + Math.floor(rng() * 2)
    for (let k = 0; k < perCity; k++) {
      const i = counter++
      const template = NAME_TEMPLATES[Math.floor(rng() * NAME_TEMPLATES.length)]
      const cuisine = CUISINES[Math.floor(rng() * CUISINES.length)]
      const name = `${city} ${template}`
      if (usedNames.has(name)) continue
      usedNames.add(name)

      const street = STREETS[Math.floor(rng() * STREETS.length)]
      const latitude = ((latBase % 90) - 45) + (rng() - 0.5) * 4
      const longitude = ((lngBase % 180) - 90) + (rng() - 0.5) * 4
      const magnitude = moneyMagnitude(country.currency.code, String(i))

      restaurants.push({
        id: `mock-rest-${countryCode.toLowerCase()}-${i}`,
        businessId: `mock-rest-${countryCode.toLowerCase()}-${i}`,
        name,
        description: `${name} serves ${cuisine.toLowerCase()} favourites in ${city}, ${country.name}. Order for pickup or fast delivery on AfriBook Food.`,
        cuisineType: cuisine,
        rating: Math.round((4.1 + rng() * 0.9) * 10) / 10,
        preparationTime: 15 + Math.floor(rng() * 25),
        deliveryRadiusKm: Math.round((5 + rng() * 10) * 10) / 10,
        minimumOrder: roundFor(country.currency, magnitude.minOrder),
        deliveryFee: roundFor(country.currency, magnitude.fee),
        currency,
        countryCode,
        city,
        address: `${12 + i * 7} ${street}, ${city}, ${country.name}`,
        location: { lat: latitude, lng: longitude },
        serviceHours: SERVICE_HOURS,
      })
    }
  }

  return restaurants
}

export function getMockRestaurantById(countryCode: string, id: string): MockRestaurant | undefined {
  return getMockRestaurants(countryCode).find((r) => r.id === id)
}

/** Resolve a mock restaurant id to its country code, or null. */
export function mockCountryFromId(id: string): string | null {
  const match = id.match(/^mock-rest-([a-z]{2})-\d+$/)
  return match ? match[1].toUpperCase() : null
}

export function getMockMenuForRestaurant(restaurantId: string): MockMenuCategory[] {
  const countryCode = mockCountryFromId(restaurantId)
  if (!countryCode) return []
  const country = COUNTRIES[countryCode]
  if (!country) return []

  const restaurant = getMockRestaurants(countryCode).find((r) => r.id === restaurantId)
  if (!restaurant) return []

  const rng = rngFor(countryCode, `menu-${restaurantId}`)
  const currencyCode = country.currency.code

  return CATEGORY_NAMES.map((catName, ci) => {
    const categoryId = `${restaurantId}-cat-${ci}`
    const itemCount = 3 + Math.floor(rng() * 2)
    const items: MockMenuItem[] = []

    for (let j = 0; j < itemCount; j++) {
      const base = restaurant.minimumOrder / (1.5 + Math.floor(rng() * 4))
      items.push({
        id: `${restaurantId}-item-${ci}-${j}`,
        businessId: restaurant.businessId,
        categoryId,
        restaurantId,
        name: MENU_ITEM_NAMES[Math.floor(rng() * MENU_ITEM_NAMES.length)],
        description: `House special at ${restaurant.name}.`,
        price: roundFor(country.currency, base),
        currencyCode,
        image: '',
        ingredients: [],
        allergens: [],
        available: true,
        preparationTime: restaurant.preparationTime + Math.floor(rng() * 10),
        modifiers: [],
      })
    }

    return {
      id: categoryId,
      businessId: restaurant.businessId,
      name: catName,
      description: CATEGORY_DESCRIPTIONS[ci],
      sortOrder: ci,
      items,
    }
  })
}