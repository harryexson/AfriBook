'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  type UserLocation,
  getStoredLocation,
  storeLocation,
  requestGeolocation,
  reverseGeocode,
  getCountryFromUrl,
  getCountryFromCookie,
} from '@/lib/geo'

interface LocationState {
  location: UserLocation | null
  loading: boolean
  error: string | null
  detectedCountryCode: string
  refresh: () => Promise<void>
  setCountry: (code: string) => void
}

const LocationContext = createContext<LocationState>({
  location: null,
  loading: true,
  error: null,
  detectedCountryCode: '',
  refresh: async () => {},
  setCountry: () => {},
})

export function useLocation() {
  return useContext(LocationContext)
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const detectedCountryCode =
    location?.countryCode ??
    getCountryFromUrl() ??
    getCountryFromCookie() ??
    'US'

  const detect = useCallback(async () => {
    setLoading(true)
    setError(null)

    const stored = getStoredLocation()
    if (stored) {
      setLocation(stored)
      setLoading(false)
      return
    }

    try {
      const pos = await requestGeolocation()
      const geo = await reverseGeocode(
        pos.coords.latitude,
        pos.coords.longitude
      )
      if (!geo) {
        setLoading(false)
        return
      }

      const userLoc: UserLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        countryCode: geo.countryCode,
        city: geo.city,
        state: geo.state,
        displayName: geo.displayName,
        timestamp: Date.now(),
      }
      setLocation(userLoc)
      storeLocation(userLoc)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Location access denied'
      setError(msg)
      const fallback: UserLocation | null = null
      setLocation(fallback)
    } finally {
      setLoading(false)
    }
  }, [])

  const setCountry = useCallback((code: string) => {
    const timestamp = Date.now()
    const loc: UserLocation = {
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0,
      countryCode: code,
      city: location?.city ?? '',
      state: location?.state ?? '',
      displayName: location?.displayName ?? '',
      timestamp,
    }
    setLocation(loc)
    storeLocation(loc)
  }, [location])

  useEffect(() => {
    detect()
  }, [detect])

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        detectedCountryCode,
        refresh: detect,
        setCountry,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}
