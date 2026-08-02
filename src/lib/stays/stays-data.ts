// ─────────────────────────────────────────────────────────────
// StaysCape Data — deterministic accommodation listings for
// every country on AfriBook. Every country gets a stable set of
// hotels and rooms so the /stays browse layer is never empty.
//
// Strategy:
//  1. Deterministic PRNG keyed by country code (+ salts).
//  2. Real booking data is persisted to Supabase via
//     POST /api/stays/bookings (see migration 008_stayscape).
// ─────────────────────────────────────────────────────────────

import { COUNTRIES } from '@/lib/localization/countries'
import type { CountryConfig } from '@/lib/localization/countries'

export interface StayAddress {
  street: string
  city: string
  formatted: string
}

export interface StayHotelData {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  countryCode: string
  country: string
  city: string
  address: StayAddress
  location: { latitude: number; longitude: number }
  starRating: number
  propertyType: string
  checkInTime: string
  checkOutTime: string
  galleryImages: string[]
  currencyCode: string
  priceFrom: number
  priceTo: number
  amenities: string[]
  rating: number
  reviewCount: number
  roomsCount: number
  isFeatured: boolean
  contact: { phone: string; email: string }
}

export interface StayRoomData {
  id: string
  hotelId: string
  roomType: string
  name: string
  description: string
  maxOccupancy: number
  bedCount: number
  bedType: string
  bathrooms: number
  sizeSqm: number
  pricePerNight: number
  currencyCode: string
  minNights: number
  quantity: number
  photos: string[]
  amenities: string[]
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

// ─── Cities per country (mirrors countries-data) ──────────────
const COUNTRY_CITIES: Record<string, string[]> = {
  NG: ['Lagos', 'Abuja', 'Ibadan', 'Kano', 'Port Harcourt'],
  KE: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
  GH: ['Accra', 'Kumasi', 'Tamale', 'Takoradi'],
  ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
  TZ: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza'],
  UG: ['Kampala', 'Entebbe', 'Mbarara', 'Gulu'],
  MW: ['Lilongwe', 'Blantyre', 'Mzuzu'],
  ZM: ['Lusaka', 'Kitwe', 'Ndola'],
  ZW: ['Harare', 'Bulawayo', 'Mutare'],
  RW: ['Kigali', 'Huye', 'Musanze'],
  ET: ['Addis Ababa', 'Dire Dawa', 'Bahir Dar'],
  EG: ['Cairo', 'Alexandria', 'Giza', 'Luxor'],
  MA: ['Casablanca', 'Marrakesh', 'Rabat', 'Fes'],
  SN: ['Dakar', 'Saint-Louis', 'Thiès'],
  CI: ['Abidjan', 'Bouaké', 'Yamoussoukro'],
  CM: ['Douala', 'Yaoundé', 'Bamenda'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
  GB: ['London', 'Manchester', 'Birmingham', 'Edinburgh'],
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'],
  FR: ['Paris', 'Lyon', 'Marseille', 'Nice'],
  DE: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  IT: ['Rome', 'Milan', 'Naples', 'Florence'],
  PT: ['Lisbon', 'Porto', 'Faro'],
  NL: ['Amsterdam', 'Rotterdam', 'The Hague'],
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Jaipur'],
  CN: ['Beijing', 'Shanghai', 'Shenzhen', 'Chengdu'],
  JP: ['Tokyo', 'Osaka', 'Kyoto'],
  TH: ['Bangkok', 'Chiang Mai', 'Phuket'],
  ID: ['Jakarta', 'Surabaya', 'Bali'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília'],
  MX: ['Mexico City', 'Guadalajara', 'Monterrey'],
  AR: ['Buenos Aires', 'Córdoba', 'Mendoza'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
}

function getCities(country: CountryConfig): string[] {
  return COUNTRY_CITIES[country.code] ?? [country.name]
}

// ─── Imagery (Unsplash stable photo IDs, mirrors marketplace) ──
const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
  'https://images.unsplash.com/photo-1560200353-ce0a76b1d438?w=800',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
]

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800',
]

const HOTEL_NAME_TEMPLATES = [
  'The Grand',
  'Royal',
  'Golden',
  'Heritage',
  'Skyline',
  'Riverside',
  'Continental',
  'Savanna',
  'Blue Lagoon',
  'Crown',
  'City Lights',
  'Bayside',
]

const HOTEL_TYPES = ['Hotel', 'Resort', 'Boutique Hotel', 'Inn', 'Suites', 'Lodge', 'Guesthouse']

const HOTEL_AMENITIES = [
  'Free Wi-Fi',
  'Restaurant',
  'Bar',
  'Outdoor Pool',
  'Fitness Center',
  'Spa & Wellness',
  'Free Parking',
  'Airport Shuttle',
  'Room Service',
  '24/7 Front Desk',
  'Conference Rooms',
  'Laundry Service',
  'Concierge',
  'Breakfast Included',
  'Beach Access',
  'EV Charging',
]

const ROOM_TYPES: { roomType: string; name: string; beds: number; bedType: string; maxOcc: number; size: number }[] = [
  { roomType: 'standard', name: 'Standard Room', beds: 1, bedType: 'double', maxOcc: 2, size: 22 },
  { roomType: 'deluxe', name: 'Deluxe Room', beds: 1, bedType: 'king', maxOcc: 2, size: 30 },
  { roomType: 'superior', name: 'Superior Room', beds: 2, bedType: 'queen', maxOcc: 3, size: 34 },
  { roomType: 'suite', name: 'Junior Suite', beds: 1, bedType: 'king', maxOcc: 3, size: 46 },
  { roomType: 'executive', name: 'Executive Suite', beds: 2, bedType: 'king', maxOcc: 4, size: 58 },
  { roomType: 'family', name: 'Family Room', beds: 3, bedType: 'queen', maxOcc: 5, size: 52 },
  { roomType: 'studio', name: 'Studio Apartment', beds: 1, bedType: 'queen', maxOcc: 2, size: 40 },
  { roomType: 'apartment', name: 'Apartment', beds: 2, bedType: 'queen', maxOcc: 4, size: 64 },
  { roomType: 'villa', name: 'Private Villa', beds: 3, bedType: 'king', maxOcc: 6, size: 120 },
]

const ROOM_AMENITIES = [
  'Air Conditioning',
  'Flat-screen TV',
  'Free Wi-Fi',
  'Mini Bar',
  'Coffee Machine',
  'In-room Safe',
  'Rain Shower',
  'Bathtub',
  'Balcony',
  'Ocean View',
  'City View',
  'Kitchenette',
  'Dining Area',
  'Work Desk',
  'Wardrobe',
  'Hair Dryer',
]

const PROPERTY_TYPE_MAP: Record<string, string> = {
  Hotel: 'hotel',
  Resort: 'resort',
  'Boutique Hotel': 'boutique_hotel',
  Inn: 'inn',
  Suites: 'aparthotel',
  Lodge: 'lodge',
  Guesthouse: 'guesthouse',
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function formatHotelPrice(country: CountryConfig, base: number): number {
  const scale = country.currency.decimalPlaces === 0 ? 1 : 100
  return Math.round((base * scale)) / scale
}

// ─── Deterministic hotel generator ────────────────────────────
export function getStayHotels(countryCode: string): StayHotelData[] {
  const country = COUNTRIES[countryCode]
  if (!country) return []

  const rng = rngFor(countryCode, 'stays')
  const cities = getCities(country)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
  const currencyCode = country.currency.code

  const count = 6 + Math.floor(rng() * 4)
  const usedNames = new Set<string>()
  const hotels: StayHotelData[] = []

  for (let i = 0; i < count; i++) {
    const city = pick(cities)
    const hotelType = pick(HOTEL_TYPES)
    const nameTemplate = pick(HOTEL_NAME_TEMPLATES)
    const name = `${nameTemplate} ${hotelType} ${city}`
    if (usedNames.has(name)) continue
    usedNames.add(name)

    const starRating = 3 + Math.floor(rng() * 3)
    const roomsCount = 18 + Math.floor(rng() * 60)
    const roomCountActual = 4 + Math.floor(rng() * 4)
    const rating = Math.round((3.9 + rng() * 1.1) * 10) / 10
    const reviewCount = Math.floor(40 + rng() * 600)
    const basePrice = 40 + Math.floor(rng() * 180)
    const priceFrom = formatHotelPrice(country, basePrice)
    const priceTo = formatHotelPrice(country, basePrice * (3 + Math.floor(rng() * 4)))

    const latBase = countryCode.charCodeAt(0) * 3 + countryCode.charCodeAt(1)
    const lngBase = countryCode.charCodeAt(1) * 5 - countryCode.charCodeAt(0)
    const latitude = ((latBase % 90) - 45) + (rng() - 0.5) * 4
    const longitude = ((lngBase % 180) - 90) + (rng() - 0.5) * 4

    const galleryCount = 4 + Math.floor(rng() * 4)
    const galleryImages = Array.from(
      { length: galleryCount },
      () => HOTEL_IMAGES[Math.floor(rng() * HOTEL_IMAGES.length)],
    )

    const amenityCount = 5 + Math.floor(rng() * 8)
    const amenities = Array.from(new Set(
      Array.from({ length: amenityCount }, () => HOTEL_AMENITIES[Math.floor(rng() * HOTEL_AMENITIES.length)]),
    ))

    hotels.push({
      id: `stay-${countryCode.toLowerCase()}-${i}`,
      name,
      slug: slugify(name),
      description: `${name} offers ${starRating}-star comfort in the heart of ${city}, ${country.name}. Book rooms instantly on AfriBook StaysCape with transparent pricing in ${currencyCode} and flexible check-in.`,
      shortDescription: `${starRating}-star ${hotelType.toLowerCase()} in ${city} with ${amenities[0]?.toLowerCase() ?? 'great service'} and fast booking on AfriBook.`,
      countryCode,
      country: country.name,
      city,
      address: {
        street: `${12 + i * 7} ${pick(['Main Street', 'Airport Road', 'Marina Boulevard', 'Queens Avenue', 'Station Road'])}`,
        city,
        formatted: `${12 + i * 7} ${pick(['Main Street', 'Airport Road', 'Marina Boulevard', 'Queens Avenue', 'Station Road'])}, ${city}, ${country.name}`,
      },
      location: { latitude, longitude },
      starRating,
      propertyType: PROPERTY_TYPE_MAP[hotelType] ?? 'hotel',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      galleryImages,
      currencyCode,
      priceFrom,
      priceTo,
      amenities,
      rating,
      reviewCount,
      roomsCount,
      isFeatured: i < 2,
      contact: {
        phone: country.phoneFormat.replace(/X/g, () => String(Math.floor(rng() * 10))),
        email: `${slugify(name).replace(/-/g, '')}@${countryCode.toLowerCase()}.afribook.com`,
      },
    })
  }

  return hotels
}

// ─── Deterministic room generator ─────────────────────────────
export function getStayRoomsForHotel(hotelId: string): StayRoomData[] {
  const match = hotelId.match(/^stay-([a-z]{2})-(\d+)$/)
  if (!match) return []
  const countryCode = match[1].toUpperCase()
  const hotelIndex = parseInt(match[2], 10)
  const country = COUNTRIES[countryCode]
  if (!country) return []

  const hotels = getStayHotels(countryCode)
  const hotel = hotels[hotelIndex]
  if (!hotel) return []

  const rng = rngFor(countryCode, `stays-rooms-${hotelIndex}`)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
  const currencyCode = country.currency.code

  const count = hotelIndex % 3 === 0 ? 6 : 5
  const used = new Set<string>()
  const rooms: StayRoomData[] = []

  for (let i = 0; i < count; i++) {
    const template = ROOM_TYPES[i % ROOM_TYPES.length]
    const priceScale = 1 + (i * 0.25)
    const price = formatHotelPrice(country, hotel.priceFrom * priceScale)
    if (used.has(template.roomType)) continue
    used.add(template.roomType)

    const photoCount = 2 + Math.floor(rng() * 3)
    const photos = Array.from(
      { length: photoCount },
      () => ROOM_IMAGES[Math.floor(rng() * ROOM_IMAGES.length)],
    )
    const amenityCount = 4 + Math.floor(rng() * 6)
    const amenities = Array.from(new Set(
      Array.from({ length: amenityCount }, () => ROOM_AMENITIES[Math.floor(rng() * ROOM_AMENITIES.length)]),
    ))

    rooms.push({
      id: `${hotelId}-r${i}`,
      hotelId,
      roomType: template.roomType,
      name: template.name,
      description: `${template.name} at ${hotel.name}. Sleeps up to ${template.maxOcc} with ${template.bedType}-bed accommodation, ${template.size} sqm of space, and thoughtful amenities.`,
      maxOccupancy: template.maxOcc,
      bedCount: template.beds,
      bedType: template.bedType,
      bathrooms: 1,
      sizeSqm: template.size,
      pricePerNight: price,
      currencyCode,
      minNights: 1,
      quantity: 2 + Math.floor(rng() * 8),
      photos,
      amenities,
    })
  }

  return rooms
}

export function getStayHotelById(countryCode: string, hotelId: string): StayHotelData | undefined {
  return getStayHotels(countryCode).find((h) => h.id === hotelId)
}

export function getStayRoomById(hotelId: string, roomId: string): StayRoomData | undefined {
  return getStayRoomsForHotel(hotelId).find((r) => r.id === roomId)
}

export function getStayCities(countryCode: string): string[] {
  const country = COUNTRIES[countryCode]
  return country ? getCities(country) : []
}
