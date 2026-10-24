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
    // Persist GPS-derived currentLocation only. The selected MARKET lives in
    // the `country` cookie + `afribook-country` storage and is managed
    // exclusively by CountryProvider — geolocation must never overwrite an
    // explicit user selection (GPS in Chicago must not reset Malawi).
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
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
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([A-Za-z]{2})`, 'i'))
  return match?.[1]?.toUpperCase() ?? ''
}

export function getCountryFromUrl(): string {
  if (typeof window === 'undefined') return ''
  const pathParts = window.location.pathname.split('/')
  const candidate = pathParts[1]?.toUpperCase()
  return candidate?.length === 2 ? candidate : ''
}

export async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const response = await fetch('/api/geo?' + new URLSearchParams({ mode: 'reverse', lat: String(latitude), lon: String(longitude) }));
    if (!response.ok) return null;
    const body = await response.json();
    return body.data[0] ?? null;
  } catch { return null; }
}

export async function geocodeAddress(query: string, countryCode?: string): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
  if (query.trim().length < 3) return null;
  const response = await fetch('/api/geo?' + new URLSearchParams({ q: query.trim(), ...(countryCode ? { country: countryCode } : {}) }));
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Address search unavailable. Please retry.');
  return body.data[0] ?? null;
}

export function locationErrorMessage(error: unknown): string {
  const code = (error as { code?: number })?.code;
  if (code === 1) return 'Location access is blocked. Allow location for this site in your browser settings, or search for your pickup address.';
  if (code === 2) return 'Your device could not determine its location. Check location services or search for your pickup address.';
  if (code === 3) return 'Location lookup timed out. Try again or search for your pickup address.';
  return error instanceof Error ? error.message : 'Could not get your location. Search for your pickup address instead.';
}

export function requestGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return reject(new Error('This browser does not support location. Search for your pickup address.'));
    if (!window.isSecureContext) return reject(new Error('Location needs HTTPS or localhost. Search for your pickup address.'));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
  });
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
