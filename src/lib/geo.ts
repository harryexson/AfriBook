export interface UserLocation {
  latitude: number
  longitude: number
  countryCode: string
  city: string
  state: string
  displayName: string
  timestamp: number
}

const STORAGE_KEY = 'afribook-location'
const COOKIE_NAME = 'country'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const COUNTRY_ZOOM_MAP: Record<string, number> = {
  US: 5, CA: 4, AU: 4, BR: 4, IN: 5, CN: 4, RU: 3,
  NG: 6, KE: 7, GH: 7, ZA: 6, TZ: 7, UG: 7, EG: 6,
  GB: 6, FR: 5, DE: 5, JP: 6, MX: 5,
}

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getStoredLocation(): UserLocation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const loc: UserLocation = JSON.parse(raw)
    if (Date.now() - loc.timestamp > 3600000) return null
    return loc
  } catch {
    return null
  }
}

export function storeLocation(loc: UserLocation): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
    document.cookie = `${COOKIE_NAME}=${loc.countryCode};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
  } catch {}
}

export function clearLocation(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function getCountryFromCookie(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([A-Z]{2})`))
  return match?.[1] ?? ''
}

export function getCountryFromUrl(): string {
  if (typeof window === 'undefined') return ''
  const pathParts = window.location.pathname.split('/')
  const candidate = pathParts[1]?.toUpperCase()
  return candidate?.length === 2 ? candidate : ''
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ countryCode: string; city: string; state: string; displayName: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address ?? {}
    const countryCode = addr.country_code?.toUpperCase()
    if (!countryCode) return null

    return {
      countryCode,
      city: addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '',
      state: addr.state ?? addr.county ?? '',
      displayName: data.display_name ?? '',
    }
  } catch {
    return null
  }
}

export function requestGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 600000,
    })
  })
}

export function sortBusinessesByProximity<T extends { location?: { latitude: number; longitude: number } }>(
  businesses: T[],
  userLat: number,
  userLon: number
): T[] {
  return [...businesses].sort((a, b) => {
    const distA = a.location
      ? haversineDistance(userLat, userLon, a.location.latitude, a.location.longitude)
      : Infinity
    const distB = b.location
      ? haversineDistance(userLat, userLon, b.location.latitude, b.location.longitude)
      : Infinity
    return distA - distB
  })
}

export function filterByProximity<T extends { location?: { latitude: number; longitude: number } }>(
  businesses: T[],
  userLat: number,
  userLon: number,
  maxRadiusKm: number = 50
): (T & { distanceKm: number })[] {
  return businesses
    .map((b) => ({
      ...b,
      distanceKm: b.location
        ? haversineDistance(userLat, userLon, b.location.latitude, b.location.longitude)
        : Infinity,
    }))
    .filter((b) => b.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 10) return `${km.toFixed(1)}km`
  return `${Math.round(km)}km`
}
