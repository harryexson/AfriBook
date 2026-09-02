'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Country is deliberately NOT stored here. It used to live on this
// `Destination` object as its own `countryCode` field, persisted
// separately from CountryProvider's cookie/localStorage — a second,
// unsynced source of truth. Since this field defaults to a non-empty
// string and callers did `destination.countryCode || countryCode`, the
// `||` never fell through: once a country was ever picked here it silently
// pinned every consumer (Hotels, Restaurants) to that country forever,
// completely ignoring the header/footer country selector. Country now
// belongs solely to CountryProvider (`useCountry()`); this store only
// holds the in-country refinement (city/neighborhood/address).
export interface Destination {
  /** City name, e.g. "Lilongwe". Empty = entire country. */
  city: string
  /** Neighborhood, e.g. "Area 18". Optional. */
  neighborhood: string
  /** Free-form address, e.g. "Area 18, Lilongwe". Optional. */
  address: string
}

const DEFAULT_DESTINATION: Destination = {
  city: '',
  neighborhood: '',
  address: '',
}

interface DestinationState {
  destination: Destination
  setDestination: (d: Partial<Destination>) => void
  clearDestination: () => void
}

export const useDestinationStore = create<DestinationState>()(
  persist(
    (set) => ({
      destination: DEFAULT_DESTINATION,
      setDestination: (patch) =>
        set((state) => ({ destination: { ...state.destination, ...patch } })),
      clearDestination: () => set({ destination: DEFAULT_DESTINATION }),
    }),
    { name: 'afribook-destination' },
  ),
)