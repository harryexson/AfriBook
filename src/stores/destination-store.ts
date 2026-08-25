'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { COUNTRIES } from '@/lib/localization/countries'

export interface Destination {
  countryCode: string
  /** City name, e.g. "Lilongwe". Empty = entire country. */
  city: string
  /** Neighborhood, e.g. "Area 18". Optional. */
  neighborhood: string
  /** Free-form address, e.g. "Area 18, Lilongwe". Optional. */
  address: string
}

/** Empty string = no explicit destination chosen yet. Consumers must fall
 *  back to their own selected market (useCountry) rather than assuming any
 *  default country here — this store never invents a market. */
const DEFAULT_DESTINATION: Destination = {
  countryCode: '',
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

/** Label for the destination chip, e.g. "Lilongwe, Malawi". */
export function destinationLabel(d: Destination): string {
  if (!d.countryCode) return 'Choose your location'
  const country = COUNTRIES[d.countryCode]
  const place = d.neighborhood || d.city
  if (place) return `${place}, ${country?.name ?? d.countryCode}`
  return country?.name ?? d.countryCode
}