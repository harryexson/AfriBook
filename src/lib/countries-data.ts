// ─────────────────────────────────────────────────────────────
// Countries Data — ensures every country in the world has
// functional content (businesses, services, stats) so the
// platform works for all 196 countries.
//
// Strategy:
//  1. Curated businesses for major markets (hand-written).
//  2. Deterministic generator for every other country so no
//     country ever renders an empty page.
//  3. Optional Supabase merge layer (see /api/countries/[code])
//     that layers real vendor data on top.
// ─────────────────────────────────────────────────────────────

import type { Business, Service, Staff } from '@/types'
import { COUNTRIES } from '@/lib/localization/countries'
import type { CountryConfig } from '@/lib/localization/countries'

export interface CountryStats {
  businesses: string
  bookings: string
  users: string
  providers: string
  rides: string
  deliveries: string
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

// ─── Cities per country (for realistic addresses) ─────────────
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
  BE: ['Brussels', 'Antwerp', 'Ghent'],
  CH: ['Zurich', 'Geneva', 'Basel'],
  AT: ['Vienna', 'Salzburg', 'Graz'],
  SE: ['Stockholm', 'Gothenburg', 'Malmö'],
  IE: ['Dublin', 'Cork', 'Galway'],
  PL: ['Warsaw', 'Kraków', 'Gdańsk'],
  TR: ['Istanbul', 'Ankara', 'Izmir'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
  SA: ['Riyadh', 'Jeddah', 'Mecca'],
  QA: ['Doha', 'Al Rayyan'],
  KW: ['Kuwait City', 'Hawally'],
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Jaipur'],
  PK: ['Karachi', 'Lahore', 'Islamabad'],
  BD: ['Dhaka', 'Chittagong', 'Khulna'],
  LK: ['Colombo', 'Kandy', 'Galle'],
  CN: ['Beijing', 'Shanghai', 'Shenzhen', 'Chengdu'],
  JP: ['Tokyo', 'Osaka', 'Kyoto'],
  KR: ['Seoul', 'Busan', 'Incheon'],
  SG: ['Singapore'],
  HK: ['Hong Kong'],
  MY: ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
  TH: ['Bangkok', 'Chiang Mai', 'Phuket'],
  VN: ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
  ID: ['Jakarta', 'Surabaya', 'Bali'],
  PH: ['Manila', 'Cebu', 'Davao'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  NZ: ['Auckland', 'Wellington', 'Christchurch'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília'],
  MX: ['Mexico City', 'Guadalajara', 'Monterrey'],
  AR: ['Buenos Aires', 'Córdoba', 'Mendoza'],
  CL: ['Santiago', 'Valparaíso', 'Concepción'],
  CO: ['Bogotá', 'Medellín', 'Cali'],
  PE: ['Lima', 'Cusco', 'Arequipa'],
  UY: ['Montevideo', 'Punta del Este'],
  EC: ['Quito', 'Guayaquil', 'Cuenca'],
  CR: ['San José', 'Liberia'],
  PA: ['Panama City', 'David'],
  DO: ['Santo Domingo', 'Punta Cana'],
  CU: ['Havana', 'Santiago de Cuba'],
  NG2: [],
}

function getCities(country: CountryConfig): string[] {
  return COUNTRY_CITIES[country.code] ?? [country.name]
}

// ─── Business templates (category → name patterns) ────────────
const SERVICE_BUSINESS_TEMPLATES: { name: string; category: string; tags: string[] }[] = [
  { name: 'Classic Barbershop', category: 'Beauty & Wellness', tags: ['barber', 'haircut', 'grooming'] },
  { name: 'Glow Beauty Salon', category: 'Beauty & Wellness', tags: ['salon', 'beauty', 'hair'] },
  { name: 'Serenity Day Spa', category: 'Beauty & Wellness', tags: ['spa', 'massage', 'wellness'] },
  { name: 'The Wellness Studio', category: 'Beauty & Wellness', tags: ['spa', 'wellness', 'therapy'] },
  { name: 'Golden Fork Restaurant', category: 'Food & Dining', tags: ['restaurant', 'dining', 'local'] },
  { name: 'Fresh Cart Groceries', category: 'Food & Dining', tags: ['groceries', 'fresh', 'market'] },
  { name: 'City Cafe', category: 'Food & Dining', tags: ['cafe', 'coffee', 'bakery'] },
  { name: 'Swift Tech Repairs', category: 'Technology', tags: ['tech', 'repairs', 'computers'] },
  { name: 'Nexus Digital Services', category: 'Technology', tags: ['web', 'digital', 'it'] },
  { name: 'HomeFix Services', category: 'Home Services', tags: ['cleaning', 'repairs', 'home'] },
  { name: 'CleanSlate Cleaning Co.', category: 'Home Services', tags: ['cleaning', 'housekeeping'] },
  { name: 'CityCare Medical Center', category: 'Healthcare', tags: ['clinic', 'medical', 'health'] },
  { name: 'BrightSmile Dental', category: 'Healthcare', tags: ['dental', 'clinic'] },
  { name: 'Stitch & Style Tailors', category: 'Fashion & Tailoring', tags: ['tailoring', 'fashion', 'bespoke'] },
  { name: 'Vogue Fashion House', category: 'Fashion & Tailoring', tags: ['fashion', 'designer'] },
  { name: 'AutoPro Garage', category: 'Automotive', tags: ['auto', 'repair', 'service'] },
  { name: 'DriveRide Rentals', category: 'Transportation', tags: ['rentals', 'transport'] },
  { name: 'EduSmart Tutors', category: 'Education', tags: ['tutoring', 'education'] },
  { name: 'Horizon Travel & Tours', category: 'Tourism', tags: ['travel', 'tours', 'tourism'] },
  { name: 'LegalWise Partners', category: 'Legal & Financial', tags: ['legal', 'law'] },
  { name: 'PrimeFit Gym', category: 'Fitness', tags: ['gym', 'fitness', 'training'] },
  { name: 'Starlight Events', category: 'Event Planning', tags: ['events', 'planning'] },
  { name: 'GreenHarvest Farms', category: 'Agriculture', tags: ['farming', 'organic'] },
]

// Services template per category (so bookings always have offerings)
const SERVICE_TEMPLATES: Record<string, { name: string; duration: number; price: number }[]> = {
  'Beauty & Wellness': [
    { name: 'Signature Haircut & Styling', duration: 60, price: 1500 },
    { name: 'Full-Head Braids', duration: 180, price: 4000 },
    { name: 'Relaxing Massage (60 min)', duration: 60, price: 2500 },
    { name: 'Manicure & Pedicure', duration: 75, price: 1800 },
    { name: 'Facial & Skincare Treatment', duration: 45, price: 2200 },
  ],
  'Food & Dining': [
    { name: 'Chef\u2019s Table Experience', duration: 90, price: 2000 },
    { name: 'Weekend Brunch', duration: 60, price: 1500 },
    { name: 'Private Event Catering', duration: 120, price: 6000 },
  ],
  'Technology': [
    { name: 'Device Diagnostics', duration: 30, price: 2000 },
    { name: 'Website Development', duration: 0, price: 20000 },
    { name: 'IT Support Session', duration: 60, price: 3000 },
  ],
  'Home Services': [
    { name: 'Deep Home Cleaning', duration: 180, price: 3500 },
    { name: 'Plumbing Repair', duration: 90, price: 2500 },
    { name: 'Electrical Maintenance', duration: 90, price: 2800 },
  ],
  'Healthcare': [
    { name: 'General Consultation', duration: 30, price: 2000 },
    { name: 'Dental Checkup', duration: 45, price: 2500 },
    { name: 'Wellness Screening', duration: 60, price: 3000 },
  ],
  'Fashion & Tailoring': [
    { name: 'Bespoke Outfit', duration: 120, price: 5000 },
    { name: 'Alterations & Repairs', duration: 45, price: 800 },
    { name: 'Custom Design Consultation', duration: 60, price: 1500 },
  ],
  'Automotive': [
    { name: 'Full Service & Oil Change', duration: 120, price: 4000 },
    { name: 'Brake & Tire Inspection', duration: 90, price: 2500 },
    { name: 'Detailing Package', duration: 150, price: 5000 },
  ],
  'Transportation': [
    { name: 'Chauffeur Service (Hourly)', duration: 60, price: 3000 },
    { name: 'Airport Transfer', duration: 60, price: 2500 },
    { name: 'Daily Vehicle Rental', duration: 0, price: 12000 },
  ],
  'Education': [
    { name: 'Private Tutoring Session', duration: 60, price: 2000 },
    { name: 'Exam Prep Course', duration: 90, price: 3500 },
  ],
  'Tourism': [
    { name: 'City Highlights Tour', duration: 180, price: 4000 },
    { name: 'Cultural Experience Day', duration: 360, price: 8000 },
    { name: 'Private Guided Excursion', duration: 300, price: 10000 },
  ],
  'Legal & Financial': [
    { name: 'Legal Consultation', duration: 60, price: 5000 },
    { name: 'Business Registration', duration: 120, price: 8000 },
    { name: 'Tax Advisory', duration: 90, price: 6000 },
  ],
  'Fitness': [
    { name: 'Personal Training (60 min)', duration: 60, price: 2500 },
    { name: 'Group Class Pass', duration: 60, price: 1500 },
  ],
  'Event Planning': [
    { name: 'Event Planning Consultation', duration: 60, price: 3000 },
    { name: 'Full Event Coordination', duration: 0, price: 20000 },
  ],
  'Agriculture': [
    { name: 'Farm Advisory Visit', duration: 120, price: 2000 },
    { name: 'Fresh Produce Box', duration: 0, price: 1500 },
  ],
}

// ─── Deterministic business generator ─────────────────────────
export function generateCountryBusinesses(countryCode: string): Business[] {
  const country = COUNTRIES[countryCode]
  if (!country) return []
  const rng = rngFor(countryCode)
  const cities = getCities(country)
  const pick = (arr: string[]) => arr[Math.floor(rng() * arr.length)]

  const count = 6 + Math.floor(rng() * 4)
  const usedNames = new Set<string>()
  const businesses: Business[] = []
  const currencyCode = country.currency.code

  for (let i = 0; i < count; i++) {
    const template = SERVICE_BUSINESS_TEMPLATES[Math.floor(rng() * SERVICE_BUSINESS_TEMPLATES.length)]
    const city = pick(cities)
    const name = `${template.name} ${city}`
    if (usedNames.has(name)) continue
    usedNames.add(name)

    const rating = Math.round((3.8 + rng() * 1.2) * 10) / 10
    const reviewCount = Math.floor(20 + rng() * 480)
    const latBase = countryCode.charCodeAt(0) * 3 + countryCode.charCodeAt(1)
    const lngBase = countryCode.charCodeAt(1) * 5 - countryCode.charCodeAt(0)
    const latitude = ((latBase % 90) - 45) + (rng() - 0.5) * 4
    const longitude = ((lngBase % 180) - 90) + (rng() - 0.5) * 4

    businesses.push({
      id: `${countryCode.toLowerCase()}-gen-${i}`,
      name,
      description: `${template.name.replace(/ [A-Z][a-z]+$/, '')} serving ${city}, ${country.name} with trusted, locally-vetted services and fast booking on AfriBook.`,
      category: template.category,
      countryCode,
      ownerId: '',
      address: {
        street: `${12 + i * 7} ${pick(['Main Street', 'Market Road', 'Liberty Ave', 'Queen St', 'Station Rd'])}`,
        city,
        state: '',
        postalCode: '',
        countryCode,
        formatted: `${12 + i * 7} ${pick(['Main Street', 'Market Road', 'Liberty Ave', 'Queen St', 'Station Rd'])}, ${city}, ${country.name}`,
        geoPoint: { latitude, longitude },
      },
      location: { latitude, longitude },
      contact: {
        phone: country.phoneFormat.replace(/X/g, () => String(Math.floor(rng() * 10))),
        email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@${countryCode.toLowerCase()}.afribook.com`,
      },
      media: { galleryUrls: [] },
      hours: Array.from({ length: 7 }, (_, d) => ({
        day: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][d] as Business['hours'][number]['day'],
        open: d === 6 ? '10:00' : '08:00',
        close: d === 6 ? '16:00' : '19:00',
        isClosed: d === 6 && rng() > 0.6,
      })),
      status: 'active',
      rating,
      reviewCount,
      qrBookingUrl: '',
      tags: template.tags,
      deliveryAvailable: rng() > 0.5,
      deliveryRadiusKm: rng() > 0.5 ? Math.floor(5 + rng() * 20) : 0,
      minimumOrder: rng() > 0.5 ? Math.floor(500 + rng() * 5000) : 0,
      commissionRate: 0.1,
      createdAt: '',
      updatedAt: '',
      _priceFrom: Math.floor(800 + rng() * 6000),
      _currencyCode: currencyCode,
    } as Business & { _priceFrom?: number; _currencyCode?: string })
  }

  return businesses
}

export function generateCountryServices(countryCode: string, businesses: Business[]): Service[] {
  const country = COUNTRIES[countryCode]
  if (!country) return []
  const rng = rngFor(countryCode, 'services')
  const currencyCode = country.currency.code
  const services: Service[] = []

  for (const b of businesses) {
    const templates = SERVICE_TEMPLATES[b.category] ?? SERVICE_TEMPLATES['Beauty & Wellness']
    const slice = templates.slice(0, Math.min(3, templates.length))
    slice.forEach((t, i) => {
      const scale = country.currency.decimalPlaces === 0 ? 1 : 1
      const price = Math.round((t.price * (0.8 + rng() * 0.4)) / (scale || 1)) * (scale || 1)
      services.push({
        id: `${b.id}-s${i}`,
        businessId: b.id,
        name: t.name,
        description: `${t.name} at ${b.name}. Book instantly on AfriBook.`,
        duration: t.duration,
        price,
        currencyCode,
        category: b.category,
        available: true,
        maxCapacityPerSlot: 2 + Math.floor(rng() * 8),
        paddingMinutes: Math.floor(rng() * 15),
        createdAt: '',
        updatedAt: '',
      })
    })
  }

  return services
}

// ─── Stats (deterministic per country) ────────────────────────
export function getCountryStats(countryCode: string): CountryStats {
  const rng = rngFor(countryCode, 'stats')
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`
    if (n >= 1000) return `${Math.round(n / 1000)}K+`
    return `${Math.round(n)}+`
  }
  const b = Math.floor(500 + rng() * 50000)
  const u = Math.floor(10000 + rng() * 900000)
  return {
    businesses: fmt(b),
    bookings: fmt(Math.floor(b * (3 + rng() * 9))),
    users: fmt(u),
    providers: fmt(Math.floor(b * 0.8)),
    rides: fmt(Math.floor(u * (0.2 + rng() * 0.5))),
    deliveries: fmt(Math.floor(b * (2 + rng() * 6))),
  }
}

// ─── Curated businesses for flagship markets ──────────────────
import { CURATED_BUSINESSES, CURATED_SERVICES } from './countries-curated'

export function getCountryBusinesses(countryCode: string): Business[] {
  const curated = CURATED_BUSINESSES[countryCode] ?? []
  if (curated.length > 0) return curated
  return generateCountryBusinesses(countryCode)
}

export function getCountryServices(countryCode: string): Service[] {
  const curated = CURATED_SERVICES[countryCode] ?? []
  const businesses = getCountryBusinesses(countryCode)
  if (curated.length > 0) return curated
  return generateCountryServices(countryCode, businesses)
}

const STAFF_DAY_ORDER: Staff['schedule'][number]['day'][] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function defaultStaffSchedule(): Staff['schedule'] {
  return STAFF_DAY_ORDER.map((day, d) => ({
    day,
    start: d === 6 ? '10:00' : '08:00',
    end: d === 6 ? '16:00' : '19:00',
    isAvailable: d !== 6,
  }))
}

/**
 * Deterministic staff for a business, derived from the business + its own
 * services so it stays consistent everywhere it's needed (business detail
 * page's Staff tab, and the booking flow's staff picker) instead of each
 * call site inventing its own — that drift is exactly how the booking page
 * ended up showing a hardcoded mock provider regardless of which business
 * was actually being booked.
 */
export function getStaffForBusiness(business: Business, services: Service[]): Staff[] {
  return [
    {
      id: `${business.id}-st1`, businessId: business.id, userId: '', name: `${business.name.split(' ')[0]} Team Lead`,
      role: 'Lead Provider', email: '', phone: business.contact.phone, avatarUrl: '',
      schedule: defaultStaffSchedule(), serviceIds: services.slice(0, 2).map((s) => s.id),
      isActive: true, bio: `Lead at ${business.name}, ensuring top quality service in ${business.address.city}.`,
      rating: Math.min(5, business.rating + 0.1), createdAt: '', updatedAt: '',
    },
    {
      id: `${business.id}-st2`, businessId: business.id, userId: '', name: `${business.address.city} Specialist`,
      role: 'Service Specialist', email: '', phone: business.contact.phone, avatarUrl: '',
      schedule: defaultStaffSchedule(), serviceIds: services.slice(2).map((s) => s.id),
      isActive: true, bio: `Focused on delivering ${business.category} excellence to every customer.`,
      rating: business.rating, createdAt: '', updatedAt: '',
    },
  ]
}

export function getAllCountryCodes(): string[] {
  return Object.keys(COUNTRIES)
}

export function getCountryMeta(code: string) {
  return COUNTRIES[code] ?? null
}
